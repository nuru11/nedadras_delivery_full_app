const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const Driver = require("../drivers/driver.model");
const User = require("../users/user.model");
const Delivery = require("./delivery.model");
const DeliveryRequest = require("./deliveryRequest.model");
const { getIo } = require("../../config/socket");
const { binToUuid, newUuidBin } = require("../../utils/uuid");
const afromessage = require("../afromessage/afromessage.service");

/**
 * Driver accepts a delivery request (transactional).
 * Updates DeliveryRequest to 'accepted', Delivery to driver_id + status 'accepted',
 * other DeliveryRequests for same delivery to 'rejected'. Notifies user via socket.
 * @param {Buffer} requestIdBin - DeliveryRequest id (BINARY(16))
 * @param {string} driverUserId - JWT sub (driver's user id, from users table)
 * @returns {{ deliveryRequest, delivery }}
 */
/** Driver cannot accept if they have a delivery in these statuses. */
const ONGOING_DRIVER_STATUSES = ["accepted", "picked", "on_way"];
/** Max concurrent trips a driver can have before they must finish or cancel one. */
const MAX_CONCURRENT_DRIVER_TRIPS = Number(process.env.MAX_DRIVER_TRIPS) || 3;

async function accept(requestIdBin, driverUserId) {
  const io = getIo();
  return sequelize.transaction(async (transaction) => {
    const driver = await Driver.findOne({ where: { user_id: driverUserId }, transaction });
    if (!driver) {
      const err = new Error("Driver record not found");
      err.status = 403;
      throw err;
    }

    const ongoingCount = await Delivery.count({
      where: {
        driver_id: driver.id,
        status: { [Op.in]: ONGOING_DRIVER_STATUSES },
      },
      transaction,
    });
    if (ongoingCount >= MAX_CONCURRENT_DRIVER_TRIPS) {
      const err = new Error(
        `You can have at most ${MAX_CONCURRENT_DRIVER_TRIPS} trips at a time. Finish or cancel one first.`
      );
      err.status = 409;
      throw err;
    }

    const dr = await DeliveryRequest.findByPk(requestIdBin, {
      include: [{ model: Delivery, as: "Delivery" }],
      transaction,
    });
    if (!dr) {
      const err = new Error("Delivery request not found");
      err.status = 404;
      throw err;
    }
    if (dr.status !== "sent") {
      const err = new Error("Request already accepted or rejected");
      err.status = 409;
      throw err;
    }
    if (String(dr.driver_id) !== String(driver.id)) {
      const err = new Error("Not authorized to accept this request");
      err.status = 403;
      throw err;
    }

    const delivery = dr.Delivery || (await Delivery.findByPk(dr.delivery_id, { transaction }));
    if (!delivery) {
      const err = new Error("Delivery not found");
      err.status = 404;
      throw err;
    }
    if (delivery.status !== "pending") {
      const err = new Error("Delivery already has a driver");
      err.status = 409;
      throw err;
    }

    await DeliveryRequest.update(
      { status: "rejected" },
      {
        where: {
          delivery_id: dr.delivery_id,
          id: { [Op.ne]: requestIdBin },
          status: "sent",
        },
        transaction,
      }
    );

    await DeliveryRequest.update(
      { status: "accepted" },
      { where: { id: requestIdBin }, transaction }
    );

    await Delivery.update(
      { driver_id: driver.id, status: "accepted" },
      { where: { id: delivery.id }, transaction }
    );

    const userId = delivery.user_id;
    const deliveryIdStr = binToUuid(delivery.id);
    const driverUser = await User.findByPk(driver.user_id, { attributes: ["name", "phone"] });
    const driver_name = driverUser?.name ?? null;
    const driver_phone = driverUser?.phone ?? null;
    if (io && userId) {
      io.to(`user:${userId}`).emit("user:delivery_accepted", {
        deliveryId: deliveryIdStr,
        deliveryRequestId: binToUuid(requestIdBin),
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
          driver_name,
          driver_phone,
        },
      });
      io.to("drivers").emit("driver:delivery_request_removed", { deliveryId: deliveryIdStr });
    }

    // Notify sender via SMS with delivery details (fire-and-forget)
    const senderUser = await User.findByPk(userId, { attributes: ["phone"], transaction });
    if (senderUser?.phone) {
      const pickup =
        (delivery.pickup_name && String(delivery.pickup_name).trim()) ||
        delivery.pickup_address ||
        "—";
      const drop =
        (delivery.drop_name && String(delivery.drop_name).trim()) ||
        delivery.drop_address ||
        "—";
      const price = delivery.price != null ? Number(delivery.price) : null;
      const km =
        delivery.distance_km != null ? Number(delivery.distance_km) : null;
      const weight = delivery.weight_kg != null ? Number(delivery.weight_kg) : null;
      const note = delivery.description && String(delivery.description).trim() ? String(delivery.description).trim() : null;
      const orderNum = String(delivery.order_number ?? 0).padStart(6, "0");
      const parts = [
        `Order #${orderNum}.`,
        "Your delivery has been accepted.",
        `Driver: ${driver_name || "Assigned"}. Contact: ${driver_phone || "N/A"}.`,
        `Pickup: ${String(pickup).slice(0, 50)}${String(pickup).length > 50 ? "..." : ""}`,
        `Drop: ${String(drop).slice(0, 50)}${String(drop).length > 50 ? "..." : ""}`,
      ];
      if (price != null && !Number.isNaN(price)) {
        parts.push(`Price: ${price} ETB`);
      }
      if (km != null && !Number.isNaN(km) && km > 0) {
        parts.push(`Distance: ${km} km`);
      }
      if (weight != null && !Number.isNaN(weight)) {
        parts.push(`Weight: ${weight} kg`);
      }
      if (note) {
        parts.push(`Note: ${note.slice(0, 80)}${note.length > 80 ? "..." : ""}`);
      }
      const smsMessage = parts.join(" ");
      // afromessage
      //   .sendSms(senderUser.phone, smsMessage)
      //   .catch((err) => console.error("SMS to sender after accept failed:", err.message));
    }

    const updatedDr = await DeliveryRequest.findByPk(requestIdBin, { transaction });
    const updatedDelivery = await Delivery.findByPk(delivery.id, { transaction });
    return { deliveryRequest: updatedDr, delivery: updatedDelivery };
  });
}

/**
 * Driver rejects a delivery request.
 * @param {Buffer} requestIdBin - DeliveryRequest id (BINARY(16))
 * @param {string} driverUserId - JWT sub (driver's user id, from users table)
 */
async function reject(requestIdBin, driverUserId) {
  const driver = await Driver.findOne({ where: { user_id: driverUserId } });
  if (!driver) {
    const err = new Error("Driver record not found");
    err.status = 403;
    throw err;
  }

  const dr = await DeliveryRequest.findByPk(requestIdBin);
  if (!dr) {
    const err = new Error("Delivery request not found");
    err.status = 404;
    throw err;
  }
  if (dr.status !== "sent") {
    const err = new Error("Request already accepted or rejected");
    err.status = 409;
    throw err;
  }
  if (String(dr.driver_id) !== String(driver.id)) {
    const err = new Error("Not authorized to reject this request");
    err.status = 403;
    throw err;
  }

  await DeliveryRequest.update({ status: "rejected" }, { where: { id: requestIdBin } });
  return { deliveryRequest: await DeliveryRequest.findByPk(requestIdBin) };
}

/**
 * Get pending (status "sent") delivery requests for a driver.
 * Used when driver loads app / logs in to fetch requests they may have missed via socket.
 * Also creates DeliveryRequests on-the-fly for pending deliveries that have no driver yet
 * (e.g. driver logged in after delivery was created).
 * @param {string} driverUserId - JWT sub (driver's user id)
 * @returns {Promise<Array<{ deliveryRequestId, deliveryId, delivery }>>}
 */
async function getPendingRequests(driverUserId) {
  const driver = await Driver.findOne({ where: { user_id: driverUserId } });
  if (!driver) return [];

  // 1. Existing DeliveryRequests with status "sent" for deliveries still pending
  const list = await DeliveryRequest.findAll({
    where: { driver_id: driver.id, status: "sent" },
    include: [{ model: Delivery, as: "Delivery", required: true }],
    order: [["created_at", "DESC"]],
  });

  const result = list
    .filter((dr) => dr.Delivery && dr.Delivery.status === "pending")
    .map((dr) => ({
      deliveryRequestId: binToUuid(dr.id),
      deliveryId: binToUuid(dr.delivery_id),
      delivery: {
        pickup_address: dr.Delivery.pickup_address,
        pickup_name: dr.Delivery.pickup_name,
        drop_address: dr.Delivery.drop_address,
        drop_name: dr.Delivery.drop_name,
        distance_km: dr.Delivery.distance_km,
        price: dr.Delivery.price,
        object_type: dr.Delivery.object_type,
      },
    }));

  // 2. Pending deliveries with no driver - create DeliveryRequest for this driver on-the-fly
  const deliveryIdsWeHave = new Set(
    list.filter((dr) => dr.Delivery?.status === "pending").map((dr) => String(dr.delivery_id))
  );

  const pendingDeliveries = await Delivery.findAll({
    where: { status: "pending", driver_id: null },
    order: [["created_at", "DESC"]],
  });

  for (const delivery of pendingDeliveries) {
    const deliveryIdStr = String(delivery.id);
    if (deliveryIdsWeHave.has(deliveryIdStr)) continue;

    const existing = await DeliveryRequest.findOne({
      where: { delivery_id: delivery.id, driver_id: driver.id },
    });
    if (existing) {
      deliveryIdsWeHave.add(deliveryIdStr);
      if (existing.status === "sent") {
        result.push({
          deliveryRequestId: binToUuid(existing.id),
          deliveryId: binToUuid(delivery.id),
          delivery: {
            pickup_address: delivery.pickup_address,
            pickup_name: delivery.pickup_name,
            drop_address: delivery.drop_address,
            drop_name: delivery.drop_name,
            distance_km: delivery.distance_km,
            price: delivery.price,
            object_type: delivery.object_type,
          },
        });
      }
      continue;
    }

    const requestId = newUuidBin();
    await DeliveryRequest.create({
      id: requestId,
      delivery_id: delivery.id,
      driver_id: driver.id,
      status: "sent",
    });
    deliveryIdsWeHave.add(deliveryIdStr);
    result.push({
      deliveryRequestId: binToUuid(requestId),
      deliveryId: binToUuid(delivery.id),
      delivery: {
        pickup_address: delivery.pickup_address,
        pickup_name: delivery.pickup_name,
        drop_address: delivery.drop_address,
        drop_name: delivery.drop_name,
        distance_km: delivery.distance_km,
        price: delivery.price,
        object_type: delivery.object_type,
      },
    });
  }

  return result;
}

module.exports = { accept, reject, getPendingRequests };
