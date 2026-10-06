const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../users/user.model");
const Driver = require("../drivers/driver.model");
const Delivery = require("../deliveries/delivery.model");
const DeliveryRequest = require("../deliveries/deliveryRequest.model");
const DriverSettlement = require("../settlements/driverSettlement.model");
const DeliveryService = require("../deliveries/delivery.service");
const SettingsService = require("../settings/settings.service");
const WalletService = require("../wallet/wallet.service");
const { getIo } = require("../../config/socket");
const { binToUuid, uuidToBin, newUuidBin } = require("../../utils/uuid");

const ONGOING_DRIVER_STATUSES = ["accepted", "picked", "on_way"];
const { fn, col } = require("sequelize");

async function getDashboardOverview() {
  const [
    activeTripsCount,
    pendingTripsCount,
    totalUsersCount,
    totalDriversCount,
    revenueResult,
    unpaidOrdersCount,
    paidOrdersCount,
  ] = await Promise.all([
    Delivery.count({ where: { status: { [Op.in]: ONGOING_DRIVER_STATUSES } } }),
    Delivery.count({ where: { status: "pending" } }),
    User.count({ where: { role: "user" } }),
    Driver.count(),
    Delivery.findAll({
      attributes: [[fn("COALESCE", fn("SUM", col("price")), 0), "total"]],
      where: {
        status: "delivered",
        created_at: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      raw: true,
    }),
    Delivery.count({ where: { payment: "unpaid" } }),
    Delivery.count({ where: { payment: "paid" } }),
  ]);

  const revenueThisMonth =
    revenueResult?.[0]?.total != null
      ? parseFloat(String(revenueResult[0].total))
      : 0;

  return {
    activeTrips: activeTripsCount,
    pendingTrips: pendingTripsCount,
    totalUsers: totalUsersCount,
    totalDrivers: totalDriversCount,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    unpaidOrdersCount,
    paidOrdersCount,
  };
}

async function getUsers() {
  const users = await User.findAll({
    where: { role: "user" },
    attributes: ["id", "name", "phone", "status"],
    order: [["name", "ASC"]],
  });
  return users.map((u) => u.toJSON());
}

async function getAllUsers(page = 1, limit = 20) {
  const offset = Math.max(0, (Number(page) || 1) - 1) * Math.min(100, Math.max(1, Number(limit) || 20));
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const { count, rows } = await User.findAndCountAll({
    where: { role: "user" },
    attributes: ["id", "name", "phone", "role", "status", "created_at"],
    order: [["created_at", "DESC"]],
    limit: safeLimit,
    offset,
  });
  return {
    users: rows.map((u) => u.toJSON()),
    currentPage: Math.floor(offset / safeLimit) + 1,
    totalPages: Math.ceil(count / safeLimit),
    totalUsers: count,
  };
}

/**
 * Create a user (admin only). No OTP; user is created with status "active".
 * @param {object} body - { name: string, phone: string }
 */
async function createUser(body) {
  const trimmedName = (body.name || "").toString().trim();
  const normalizedPhone = String(body.phone || "")
    .replace(/\s+/g, "")
    .trim();

  if (!trimmedName) {
    const err = new Error("Name is required");
    err.status = 400;
    throw err;
  }
  if (!normalizedPhone) {
    const err = new Error("Phone is required");
    err.status = 400;
    throw err;
  }
  if (!normalizedPhone.startsWith("09") || normalizedPhone.length !== 10) {
    const err = new Error("Phone must start with 09 and be 10 digits");
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ where: { phone: normalizedPhone } });
  if (existing) {
    const err = new Error("Phone Already Exists");
    err.status = 409;
    throw err;
  }

  const user = await User.create({
    name: trimmedName,
    phone: normalizedPhone,
    role: "user",
    status: "active",
  });

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
}

async function getDrivers() {
  const drivers = await Driver.findAll({
    include: [
      {
        model: User,
        as: "User",
        attributes: ["id", "name", "phone", "status"],
        required: true,
      },
    ],
    order: [[{ model: User, as: "User" }, "name", "ASC"]],
  });
  return drivers.map((d) => {
    const u = d.User;
    return {
      id: d.id,
      user_id: d.user_id,
      name: u?.name,
      phone: u?.phone,
      vehicle_type: d.vehicle_type,
      plate_number: d.plate_number,
      driver_type: d.driver_type,
      status: u?.status,
    };
  });
}

async function updateDriverType(driverId, newType) {
  const allowedTypes = ["in_house", "freelancer"];
  if (!allowedTypes.includes(newType)) {
    const err = new Error(
      `Driver type must be one of: ${allowedTypes.join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(driverId, {
    include: [
      {
        model: User,
        as: "User",
        attributes: ["id", "name", "phone", "status"],
        required: true,
      },
    ],
  });

  if (!driver || !driver.User) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }

  await driver.update({ driver_type: newType });

  const u = driver.User;
  return {
    id: driver.id,
    user_id: driver.user_id,
    name: u?.name,
    phone: u?.phone,
    vehicle_type: driver.vehicle_type,
    plate_number: driver.plate_number,
    driver_type: driver.driver_type,
    status: u?.status,
  };
}

async function updateDriverStatus(driverId, newStatus) {
  const allowedStatuses = ["pending", "active", "inactive", "deleted"];
  if (!allowedStatuses.includes(newStatus)) {
    const err = new Error(
      `Status must be one of: ${allowedStatuses.join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(driverId, {
    include: [
      {
        model: User,
        as: "User",
        attributes: ["id", "name", "phone", "status"],
        required: true,
      },
    ],
  });

  if (!driver || !driver.User) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }

  await driver.User.update({ status: newStatus });

  const u = driver.User;
  return {
    id: driver.id,
    user_id: driver.user_id,
    name: u?.name,
    phone: u?.phone,
    vehicle_type: driver.vehicle_type,
    plate_number: driver.plate_number,
    status: newStatus,
  };
}

async function updateUserStatus(userId, newStatus) {
  const allowedStatuses = ["pending", "active", "inactive", "deleted"];
  if (!allowedStatuses.includes(newStatus)) {
    const err = new Error(
      `Status must be one of: ${allowedStatuses.join(", ")}`
    );
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await user.update({ status: newStatus });

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
}

async function getDeliveries(statusFilter, ongoing = false, history = false) {
  const where = {};
  if (ongoing) {
    where.status = { [Op.in]: ["accepted", "picked", "on_way"] };
  } else if (history) {
    where.status = { [Op.in]: ["delivered", "cancelled"] };
  } else if (statusFilter) {
    where.status = statusFilter;
  }
  const deliveries = await Delivery.findAll({
    where,
    include: [
      {
        model: User,
        as: "User",
        attributes: ["id", "name", "phone"],
        required: false,
      },
      {
        model: Driver,
        as: "Driver",
        required: false,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "phone"],
            required: false,
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return deliveries.map((d) => {
    const data = d.toJSON ? d.toJSON() : d;
    const { User: u, Driver: dr, ...rest } = data;
    const idStr = d.id && Buffer.isBuffer(d.id) ? binToUuid(d.id) : d.id;
    const user = d.User;
    const driver = d.Driver;
    const driverUser = driver?.User;
    return {
      ...rest,
      id: idStr,
      user: user
        ? { id: user.id, name: user.name, phone: user.phone }
        : null,
      driver: driver
        ? {
            id: driver.id,
            name: driverUser?.name,
            phone: driverUser?.phone,
          }
        : null,
    };
  });
}

async function createDelivery(body) {
  if (body.user_id) {
    const user = await User.findByPk(body.user_id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    if (user.role !== "user") {
      const err = new Error("Requester must be a user");
      err.status = 400;
      throw err;
    }
  }
  const { delivery, deliveryRequests } =
    await DeliveryService.createDeliveryByAdmin(body);
  const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
  const idStr =
    delivery.id && Buffer.isBuffer(delivery.id)
      ? binToUuid(delivery.id)
      : delivery.id;

  return {
    delivery: { ...deliveryData, id: idStr },
    deliveryRequestCount: deliveryRequests.length,
  };
}

async function createOutsideTownDelivery(body) {
  if (body.user_id) {
    const user = await User.findByPk(body.user_id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    if (user.role !== "user") {
      const err = new Error("Requester must be a user");
      err.status = 400;
      throw err;
    }
  }
  const { delivery } =
    await DeliveryService.createOutsideTownDelivery(body.user_id || null, body, {
      allowCustomPrice: true,
    });
  const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
  const idStr =
    delivery.id && Buffer.isBuffer(delivery.id)
      ? binToUuid(delivery.id)
      : delivery.id;

  return {
    delivery: { ...deliveryData, id: idStr },
    deliveryRequestCount: 0,
  };
}

async function assignDelivery(deliveryId, driverId) {
  let deliveryIdBin;
  try {
    deliveryIdBin = uuidToBin(deliveryId);
  } catch {
    const err = new Error("Invalid delivery id");
    err.status = 400;
    throw err;
  }

  const delivery = await Delivery.findByPk(deliveryIdBin, {
    include: [{ model: Driver, as: "Driver", attributes: ["id", "user_id"] }],
  });
  if (!delivery) {
    const err = new Error("Delivery not found");
    err.status = 404;
    throw err;
  }
  if (delivery.status !== "pending") {
    const err = new Error("Can only assign pending deliveries");
    err.status = 400;
    throw err;
  }
  if (delivery.driver_id) {
    const err = new Error("Delivery already has a driver");
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(driverId, {
    include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }],
  });
  if (!driver) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }

  // Admin can assign a driver even if they have ongoing trips (driver can have up to 3).

  return sequelize.transaction(async (transaction) => {
    await DeliveryRequest.update(
      { status: "rejected" },
      {
        where: { delivery_id: deliveryIdBin, status: "sent" },
        transaction,
      }
    );

    let dr = await DeliveryRequest.findOne({
      where: { delivery_id: deliveryIdBin, driver_id: driver.id },
      transaction,
    });
    if (!dr) {
      const requestId = newUuidBin();
      await DeliveryRequest.create(
        {
          id: requestId,
          delivery_id: deliveryIdBin,
          driver_id: driver.id,
          status: "accepted",
        },
        { transaction }
      );
    } else {
      await DeliveryRequest.update(
        { status: "accepted" },
        { where: { id: dr.id }, transaction }
      );
    }

    await Delivery.update(
      { driver_id: driver.id, status: "accepted" },
      { where: { id: delivery.id }, transaction }
    );

    const io = getIo();
    const deliveryIdStr = binToUuid(deliveryIdBin);
    const payload = {
      deliveryId: deliveryIdStr,
      status: "accepted",
      delivery: {
        id: deliveryIdStr,
        status: "accepted",
        pickup_address: delivery.pickup_address,
        pickup_name: delivery.pickup_name,
        drop_address: delivery.drop_address,
        drop_name: delivery.drop_name,
        distance_km: delivery.distance_km,
        price: delivery.price,
      },
    };

    if (io) {
      if (delivery.user_id) {
        io.to(`user:${delivery.user_id}`).emit("user:delivery_accepted", payload);
      }
      io.to("drivers").emit("driver:delivery_request_removed", {
        deliveryId: deliveryIdStr,
      });
      io.to(`driver:${driver.user_id}`).emit("driver:delivery_assigned", payload);
    }

    const updated = await Delivery.findByPk(delivery.id, {
      include: [
        { model: User, as: "User", attributes: ["id", "name", "phone"] },
        {
          model: Driver,
          as: "Driver",
          include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }],
        },
      ],
      transaction,
    });
    const data = updated.toJSON ? updated.toJSON() : updated;
    const idStrOut =
      updated.id && Buffer.isBuffer(updated.id)
        ? binToUuid(updated.id)
        : updated.id;
    return { delivery: { ...data, id: idStrOut } };
  });
}

async function updateDeliveryStatus(deliveryId, newStatus) {
  return DeliveryService.updateDeliveryStatusByAdmin(deliveryId, newStatus);
}

async function createSettlement(body, adminUserId) {
  const driverId = body.driver_id;
  const amount = parseFloat(body.amount);
  const receivedAt = body.received_at ? new Date(body.received_at) : new Date();
  const notes = (body.notes || "").toString().trim() || null;

  if (!driverId) {
    const err = new Error("driver_id is required");
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error("amount must be a positive number");
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(driverId, {
    include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }],
  });
  if (!driver || !driver.User) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }

  const settlement = await DriverSettlement.create({
    driver_id: driverId,
    amount: Math.round(amount * 100) / 100,
    received_at: receivedAt,
    notes,
    created_by: adminUserId,
  });

  const data = settlement.toJSON ? settlement.toJSON() : settlement;
  return {
    ...data,
    driver_name: driver.User?.name,
    driver_phone: driver.User?.phone,
  };
}

async function getSettlements(filters = {}) {
  const driverId = filters.driver_id || null;
  const where = driverId ? { driver_id: driverId } : {};
  const settlements = await DriverSettlement.findAll({
    where,
    include: [
      { model: Driver, as: "Driver", required: true, include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }] },
      { model: User, as: "CreatedBy", foreignKey: "created_by", attributes: ["id", "name"] },
    ],
    order: [["received_at", "DESC"]],
  });
  return settlements.map((s) => {
    const data = s.toJSON ? s.toJSON() : s;
    const driverUser = data.Driver?.User;
    return {
      id: data.id,
      driver_id: data.driver_id,
      driver_name: driverUser?.name,
      driver_phone: driverUser?.phone,
      amount: data.amount,
      received_at: data.received_at,
      notes: data.notes,
      created_by: data.created_by,
      created_by_name: data.CreatedBy?.name,
      created_at: data.created_at,
    };
  });
}

async function getDriverPaymentSummary(driverId) {
  const driver = await Driver.findByPk(driverId, {
    include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }],
  });
  if (!driver || !driver.User) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }

  const { fn, col } = require("sequelize");
  const paidDeliveries = await Delivery.findAll({
    where: { driver_id: driverId, status: "delivered", payment: "paid" },
    attributes: ["id", "price", "driver_commission_amount", "amount_due_to_admin", "payment", "paid_from_wallet", "created_at"],
    order: [["created_at", "DESC"]],
    raw: true,
  });

  // Cash to hand over: only trips where customer paid cash (not wallet)
  const totalDueResult = await Delivery.findAll({
    where: {
      driver_id: driverId,
      status: "delivered",
      payment: "paid",
      [Op.or]: [{ paid_from_wallet: false }, { paid_from_wallet: null }],
    },
    attributes: [[fn("COALESCE", fn("SUM", col("amount_due_to_admin")), 0), "total"]],
    raw: true,
  });
  const totalDueFromDeliveries = totalDueResult?.[0]?.total != null ? parseFloat(String(totalDueResult[0].total)) : 0;

  // Commission owed to driver from wallet-paid trips (admin will pay driver)
  const commissionWalletResult = await Delivery.findAll({
    where: { driver_id: driverId, status: "delivered", payment: "paid", paid_from_wallet: true },
    attributes: [[fn("COALESCE", fn("SUM", col("driver_commission_amount")), 0), "total"]],
    raw: true,
  });
  const totalCommissionFromWalletPaid = commissionWalletResult?.[0]?.total != null ? parseFloat(String(commissionWalletResult[0].total)) : 0;

  const totalSettledResult = await DriverSettlement.findAll({
    where: { driver_id: driverId },
    attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total"]],
    raw: true,
  });
  const totalSettled = totalSettledResult?.[0]?.total != null ? parseFloat(String(totalSettledResult[0].total)) : 0;

  const balance = Math.round((totalDueFromDeliveries - totalSettled) * 100) / 100;

  const settlements = await DriverSettlement.findAll({
    where: { driver_id: driverId },
    order: [["received_at", "DESC"]],
    raw: true,
  });

  const deliveriesWithIdStr = paidDeliveries.map((d) => {
    const idStr = d.id && Buffer.isBuffer(d.id) ? binToUuid(d.id) : d.id;
    return { ...d, id: idStr };
  });

  return {
    driver: { id: driver.id, name: driver.User?.name, phone: driver.User?.phone },
    totalDueFromDeliveries: Math.round(totalDueFromDeliveries * 100) / 100,
    totalSettled: Math.round(totalSettled * 100) / 100,
    balance,
    totalCommissionFromWalletPaid: Math.round(totalCommissionFromWalletPaid * 100) / 100,
    paidDeliveries: deliveriesWithIdStr,
    settlements,
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Admin: update delivery payment status to paid/unpaid.
 * - paid: debit user wallet (if sufficient balance), mark as paid, paid_from_wallet=true, compute commissions.
 * - unpaid: if previously wallet-paid, refund wallet; otherwise just mark unpaid.
 */
async function updateDeliveryPayment(deliveryId, body) {
  const desired = (body?.payment || "").toString().trim().toLowerCase();
  if (!desired || !["paid", "unpaid"].includes(desired)) {
    const err = new Error('payment must be "paid" or "unpaid"');
    err.status = 400;
    throw err;
  }

  let deliveryIdBin;
  try {
    deliveryIdBin = uuidToBin(deliveryId);
  } catch {
    const err = new Error("Invalid delivery id");
    err.status = 400;
    throw err;
  }

  const delivery = await Delivery.findByPk(deliveryIdBin, {
    include: [{ model: Driver, as: "Driver", attributes: ["id", "user_id", "driver_type"] }],
  });
  if (!delivery) {
    const err = new Error("Delivery not found");
    err.status = 404;
    throw err;
  }

  if (delivery.status !== "delivered") {
    const err = new Error("Can only change payment when delivery status is delivered");
    err.status = 400;
    throw err;
  }

  const price = parseFloat(delivery.price) || 0;
  if (price <= 0) {
    const err = new Error("Invalid delivery price");
    err.status = 400;
    throw err;
  }

  // Already in requested state
  if (delivery.payment === desired) {
    return delivery;
  }

  const userId = delivery.user_id;
  if (desired === "paid") {
    if (!userId) {
      const err = new Error("Delivery has no requester user; cannot pay from wallet");
      err.status = 400;
      throw err;
    }
    if (!delivery.driver_id) {
      const err = new Error("Delivery has no assigned driver");
      err.status = 400;
      throw err;
    }

    const roundedPrice = round2(price);
    const balance = await WalletService.getUserWalletBalance(userId);
    if (balance < roundedPrice) {
      const err = new Error(
        `Insufficient wallet balance. Balance: ${round2(balance)} ETB, price: ${roundedPrice} ETB`
      );
      err.status = 400;
      throw err;
    }

    const rates = await SettingsService.getCommissionRates();

    await sequelize.transaction(async (t) => {
      await WalletService.debitForDelivery(userId, delivery.id, roundedPrice, t);
      const driverType = (delivery.Driver?.driver_type || "freelancer").toLowerCase();
      const rate = rates[driverType] ?? rates.freelancer;
      const driverCommissionAmount = round2(price * rate);
      const amountDueToAdmin = round2(price - driverCommissionAmount);
      await delivery.update(
        {
          payment: "paid",
          paid_from_wallet: true,
          wallet_debit_amount: roundedPrice,
          driver_commission_amount: driverCommissionAmount,
          amount_due_to_admin: amountDueToAdmin,
        },
        { transaction: t }
      );
    });

    return Delivery.findByPk(delivery.id);
  }

  // desired === "unpaid"
  if (delivery.payment !== "paid") {
    const err = new Error("Delivery is already unpaid");
    err.status = 400;
    throw err;
  }

  // If it was wallet-paid, refund the wallet
  if (delivery.paid_from_wallet && userId && delivery.wallet_debit_amount) {
    const refundAmount = parseFloat(delivery.wallet_debit_amount) || 0;
    if (refundAmount > 0) {
      await sequelize.transaction(async (t) => {
        await WalletService.creditForDelivery(userId, delivery.id, refundAmount, t);
        await delivery.update(
          {
            payment: "unpaid",
            paid_from_wallet: false,
            wallet_debit_amount: null,
          },
          { transaction: t }
        );
      });
      return Delivery.findByPk(delivery.id);
    }
  }

  await delivery.update({
    payment: "unpaid",
    paid_from_wallet: false,
    wallet_debit_amount: null,
  });
  return delivery;
}

/**
 * Admin: update admin remark for a delivery.
 */
async function updateDeliveryRemark(deliveryId, body) {
  const remarkRaw = body?.remark;
  const remark =
    remarkRaw === null || remarkRaw === undefined
      ? null
      : String(remarkRaw).toString().trim();

  let deliveryIdBin;
  try {
    deliveryIdBin = uuidToBin(deliveryId);
  } catch {
    const err = new Error("Invalid delivery id");
    err.status = 400;
    throw err;
  }

  const delivery = await Delivery.findByPk(deliveryIdBin);
  if (!delivery) {
    const err = new Error("Delivery not found");
    err.status = 404;
    throw err;
  }

  await delivery.update({ admin_remark: remark && remark.length ? remark : null });
  return delivery;
}

async function getAllDriversPaymentSummary() {
  const drivers = await Driver.findAll({
    include: [{ model: User, as: "User", attributes: ["id", "name", "phone"] }],
  });
  const summaries = [];
  for (const d of drivers) {
    const summary = await getDriverPaymentSummary(d.id);
    summaries.push(summary);
  }
  return { drivers: summaries };
}

function serializeAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name ?? null,
    adminRole: admin.admin_role || "operations",
    created_at: admin.created_at,
  };
}

async function listAdmins() {
  const Admin = require("../admins/admin.model");
  const admins = await Admin.findAll({
    attributes: ["id", "username", "name", "admin_role", "created_at"],
    order: [["created_at", "ASC"]],
  });
  return { admins: admins.map(serializeAdmin) };
}

async function createAdmin(body) {
  const Admin = require("../admins/admin.model");
  const ADMIN_ROLES = Admin.ADMIN_ROLES || [
    "super_admin",
    "operations",
    "finance",
  ];
  const bcrypt = require("bcryptjs");

  const username = (body.username || "").trim();
  const plainPassword = body.password == null ? "" : String(body.password);
  const name = body.name != null ? String(body.name).trim() || null : null;
  const adminRole = (body.admin_role || body.adminRole || "operations").trim();

  if (!username) {
    const error = new Error("Username is required");
    error.status = 400;
    throw error;
  }
  if (username.length < 3 || username.length > 50) {
    const error = new Error("Username must be 3–50 characters");
    error.status = 400;
    throw error;
  }
  if (!plainPassword || plainPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.status = 400;
    throw error;
  }
  if (!ADMIN_ROLES.includes(adminRole)) {
    const error = new Error(
      `admin_role must be one of: ${ADMIN_ROLES.join(", ")}`
    );
    error.status = 400;
    throw error;
  }

  const existing = await Admin.findOne({ where: { username } });
  if (existing) {
    const error = new Error("Username already taken");
    error.status = 409;
    throw error;
  }

  const password_hash = bcrypt.hashSync(plainPassword, 10);
  const admin = await Admin.create({
    username,
    password_hash,
    name,
    admin_role: adminRole,
  });

  return { admin: serializeAdmin(admin) };
}

async function updateAdmin(adminId, body) {
  const Admin = require("../admins/admin.model");
  const ADMIN_ROLES = Admin.ADMIN_ROLES || [
    "super_admin",
    "operations",
    "finance",
  ];

  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  const updates = {};
  if (body.name !== undefined) {
    updates.name =
      body.name == null ? null : String(body.name).trim() || null;
  }

  const nextRoleRaw = body.admin_role ?? body.adminRole;
  if (nextRoleRaw !== undefined) {
    const nextRole = String(nextRoleRaw).trim();
    if (!ADMIN_ROLES.includes(nextRole)) {
      const error = new Error(
        `admin_role must be one of: ${ADMIN_ROLES.join(", ")}`
      );
      error.status = 400;
      throw error;
    }
    if (
      admin.admin_role === "super_admin" &&
      nextRole !== "super_admin"
    ) {
      const superCount = await Admin.count({
        where: { admin_role: "super_admin" },
      });
      if (superCount <= 1) {
        const error = new Error("Cannot demote the last super_admin");
        error.status = 400;
        throw error;
      }
    }
    updates.admin_role = nextRole;
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No fields to update");
    error.status = 400;
    throw error;
  }

  await admin.update(updates);
  return { admin: serializeAdmin(admin) };
}

async function updateAdminPassword(adminId, body) {
  const Admin = require("../admins/admin.model");
  const bcrypt = require("bcryptjs");

  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    const error = new Error("Admin not found");
    error.status = 404;
    throw error;
  }

  const plainPassword = body.password == null ? "" : String(body.password);
  if (!plainPassword || plainPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.status = 400;
    throw error;
  }

  await admin.update({ password_hash: bcrypt.hashSync(plainPassword, 10) });
  return { ok: true };
}

module.exports = {
  getDashboardOverview,
  getUsers,
  getAllUsers,
  createUser,
  getDrivers,
  getDeliveries,
  createDelivery,
  createOutsideTownDelivery,
  assignDelivery,
  updateDeliveryStatus,
  updateDriverStatus,
  updateUserStatus,
  updateDriverType,
  createSettlement,
  getSettlements,
  getDriverPaymentSummary,
  getAllDriversPaymentSummary,
  updateDeliveryPayment,
  updateDeliveryRemark,
  listAdmins,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
};
