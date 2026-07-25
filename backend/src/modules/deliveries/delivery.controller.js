const DeliveryService = require("./delivery.service");
const { binToUuid } = require("../../utils/uuid");
const AdminService = require("../admin/admin.service");

/** GET /api/deliveries/:id/driver-location — user only, returns current driver lat/lng. */
async function getDriverLocation(req, res) {
  if (req.user?.role !== "user") {
    return res.status(403).json({ message: "Only users can get driver location" });
  }
  const userId = req.user.sub;
  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  const deliveryId = req.params.id;
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery id is required" });
  }
  try {
    const location = await DeliveryService.getDriverLocation(deliveryId, userId);
    if (!location) {
      return res.status(404).json({ message: "Driver location not available" });
    }
    return res.status(200).json(location);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to get driver location";
    return res.status(status).json({ message });
  }
}

function parseCoord(value) {
  if (value === undefined || value === null) return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

async function estimate(req, res) {
  try {
    const { pickup, dropoff } = req.body || {};
    const pickupLat = parseCoord(pickup?.lat);
    const pickupLng = parseCoord(pickup?.lng);
    const dropoffLat = parseCoord(dropoff?.lat);
    const dropoffLng = parseCoord(dropoff?.lng);

    if (
      Number.isNaN(pickupLat) ||
      Number.isNaN(pickupLng) ||
      Number.isNaN(dropoffLat) ||
      Number.isNaN(dropoffLng)
    ) {
      return res.status(400).json({
        message:
          "Body must include pickup: { lat, lng } and dropoff: { lat, lng } with numeric values",
      });
    }

    const { distanceKm, plans } = await DeliveryService.estimate(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    return res.status(200).json({ distanceKm, plans });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message =
      status >= 500 ? "Failed to compute estimate" : err.message || "Bad request";
    return res.status(status).json({ message });
  }
}

/** POST /api/deliveries — user only. Create delivery and notify nearby drivers. */
async function create(req, res) {
  try {
    if (req.user?.role !== "user") {
      return res.status(403).json({
        message: "Only users can create deliveries",
      });
    }

    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }

    const { delivery, deliveryRequests } =
      await DeliveryService.createDelivery(userId, req.body || {});

    const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr = delivery.id && Buffer.isBuffer(delivery.id)
      ? binToUuid(delivery.id)
      : delivery.id;
    const response = {
      delivery: {
        ...deliveryData,
        id: idStr,
      },
      deliveryRequestCount: deliveryRequests.length,
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error("Create delivery error:", err.message || err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create delivery";
    return res.status(status).json({ message });
  }
}

/** POST /api/deliveries/outside-town — user only. Create outside-town delivery. */
async function createOutsideTown(req, res) {
  try {
    if (req.user?.role !== "user") {
      return res.status(403).json({
        message: "Only users can create deliveries",
      });
    }

    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }

    const { delivery, deliveryRequests } =
      await DeliveryService.createOutsideTownDelivery(userId, req.body || {});

    const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id)
        ? binToUuid(delivery.id)
        : delivery.id;
    const response = {
      delivery: {
        ...deliveryData,
        id: idStr,
      },
      deliveryRequestCount: deliveryRequests.length,
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error("Create outside-town delivery error:", err.message || err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to create outside-town delivery";
    return res.status(status).json({ message });
  }
}

/** GET /api/deliveries/history — past deliveries (delivered/cancelled) for user or driver. */
async function getHistory(req, res) {
  const userId = req.user?.sub;
  const role = req.user?.role;
  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  try {
    const limit = parseInt(req.query?.limit, 10);
    const deliveries = await DeliveryService.getDeliveryHistory(
      userId,
      role,
      Number.isFinite(limit) ? { limit } : {},
    );
    const list = deliveries.map((d) => {
      const data = d.toJSON ? d.toJSON() : d;
      const idStr = d.id && Buffer.isBuffer(d.id) ? binToUuid(d.id) : d.id;
      return { ...data, id: idStr };
    });
    return res.status(200).json({ deliveries: list });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to get delivery history";
    return res.status(status).json({ message });
  }
}

/** GET /api/deliveries/active — current ongoing delivery for user or driver. */
async function getActive(req, res) {
  const userId = req.user?.sub;
  const role = req.user?.role;
  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  try {
    const delivery = await DeliveryService.getActiveDelivery(userId, role);
    if (!delivery) {
      return res.status(200).json({ delivery: null });
    }
    const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id)
        ? binToUuid(delivery.id)
        : delivery.id;
    const driverUser = deliveryData.Driver?.User;
    const driver_name = driverUser?.name ?? null;
    const driver_phone = driverUser?.phone ?? null;
    return res.status(200).json({
      delivery: { ...deliveryData, id: idStr, driver_name, driver_phone },
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to get active delivery";
    return res.status(status).json({ message });
  }
}

/** GET /api/deliveries/active-list — all ongoing deliveries for user; for driver returns single in array. */
async function getActiveList(req, res) {
  // console.log("getActiveList", req.user);
  const userId = req.user?.sub;
  const role = req.user?.role;
  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  try {
    const deliveries = await DeliveryService.getActiveDeliveries(userId, role);
    const list = deliveries.map((d) => {
      const data = d.toJSON ? d.toJSON() : d;
      const idStr = d.id && Buffer.isBuffer(d.id) ? binToUuid(d.id) : d.id;
      const driverUser = data.Driver?.User;
      const driver_name = driverUser?.name ?? null;
      const driver_phone = driverUser?.phone ?? null;
      return { ...data, id: idStr, driver_name, driver_phone };
    });
    // console.log("list", list);
    return res.status(200).json({ deliveries: list });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to get active deliveries";
    console.error("getActiveList error:", err.message || err);
    return res.status(status).json({ message });
  }
}

/** GET /api/deliveries/me/payment-summary — driver-only payment summary. */
async function getMyPaymentSummary(req, res) {
  try {
    const userId = req.user?.sub;
    const role = (req.user?.role || "").toLowerCase();

    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }
    if (role !== "driver") {
      return res
        .status(403)
        .json({ message: "Only drivers can access payment summary" });
    }

    const Driver = require("../drivers/driver.model");
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const summary = await AdminService.getDriverPaymentSummary(driver.id);
    return res.status(200).json({
      totalDueFromDeliveries: summary.totalDueFromDeliveries,
      totalSettled: summary.totalSettled,
      balance: summary.balance,
      totalCommissionFromWalletPaid: summary.totalCommissionFromWalletPaid ?? 0,
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch payment summary";
    return res.status(status).json({ message });
  }
}

/** PATCH /api/deliveries/:id/status — user sets "picked", driver sets "delivered". */
async function updateStatus(req, res) {
  const userId = req.user?.sub;
  const role = req.user?.role;
  const deliveryId = req.params.id;
  const newStatus = req.body?.status;
  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  if (!deliveryId || !newStatus) {
    return res.status(400).json({ message: "Delivery id and status are required" });
  }
  try {
    await DeliveryService.updateDeliveryStatus(deliveryId, userId, role, newStatus);
    return res.status(200).json({ status: newStatus });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update status";
    return res.status(status).json({ message });
  }
}

/** PATCH /api/deliveries/:id/payment — driver marks cash received ("paid"). */
async function updatePayment(req, res) {
  const userId = req.user?.sub;
  const role = req.user?.role;
  const deliveryId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  if ((role || "").toLowerCase() !== "driver") {
    return res.status(403).json({ message: "Only drivers can update payment status" });
  }
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery id is required" });
  }

  try {
    const delivery = await DeliveryService.markDeliveryPaid(deliveryId, userId);
    const data = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id)
        ? binToUuid(delivery.id)
        : delivery.id;
    return res.status(200).json({
      delivery: {
        ...data,
        id: idStr,
      },
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to update payment";
    return res.status(status).json({ message });
  }
}

/** POST /api/deliveries/:id/pay-with-wallet — user pays delivered unpaid delivery with wallet. */
async function payWithWallet(req, res) {
  const userId = req.user?.sub;
  const role = (req.user?.role || "").toLowerCase();
  const deliveryId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "User id missing" });
  }
  if (role !== "user") {
    return res.status(403).json({ message: "Only users can pay with wallet" });
  }
  if (!deliveryId) {
    return res.status(400).json({ message: "Delivery id is required" });
  }

  try {
    const delivery = await DeliveryService.payDeliveryWithWallet(deliveryId, userId);
    const data = delivery.toJSON ? delivery.toJSON() : delivery;
    const idStr =
      delivery.id && Buffer.isBuffer(delivery.id)
        ? binToUuid(delivery.id)
        : delivery.id;
    return res.status(200).json({
      delivery: {
        ...data,
        id: idStr,
      },
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to pay with wallet";
    return res.status(status).json({ message });
  }
}

module.exports = {
  estimate,
  create,
  createOutsideTown,
  getDriverLocation,
  getHistory,
  getActive,
  getActiveList,
  updateStatus,
  updatePayment,
  getMyPaymentSummary,
  payWithWallet,
};
