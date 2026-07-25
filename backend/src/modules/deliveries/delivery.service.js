const env = require("../../config/env");
const sequelize = require("../../config/db");
const { ensureRedisConnected } = require("../../config/redis");
const { getIo } = require("../../config/socket");
const { Op } = require("sequelize");
const Delivery = require("./delivery.model");
const DeliveryRequest = require("./deliveryRequest.model");
const DeliveryOrderSequence = require("./deliveryOrderSequence.model");
const Driver = require("../drivers/driver.model");
const User = require("../users/user.model");
const WalletService = require("../wallet/wallet.service");
const SettingsService = require("../settings/settings.service");
const afromessage = require("../afromessage/afromessage.service");
const { newUuidBin, binToUuid, uuidToBin } = require("../../utils/uuid");

const DISTANCE_MATRIX_BASE =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

/** Redis key for driver locations (GEO). Members = driver user id (string). */
const DRIVERS_GEO_KEY = "drivers:geo";
const NEARBY_RADIUS_KM = 3;
const ORDER_NUMBER_SEQUENCE_NAME = "delivery_order_number";
const ORDER_NUMBER_MAX = 999999;

/**
 * Get next 6-digit order number (1-999999). Uses sequence table for atomicity.
 * @returns {Promise<number>}
 */
async function getNextDeliveryOrderNumber() {
  await DeliveryOrderSequence.findOrCreate({
    where: { name: ORDER_NUMBER_SEQUENCE_NAME },
    defaults: { value: 0 },
  });
  await sequelize.query(
    `UPDATE delivery_order_sequence SET value = LAST_INSERT_ID(value + 1) WHERE name = ?`,
    { replacements: [ORDER_NUMBER_SEQUENCE_NAME] }
  );
  const [[row]] = await sequelize.query(
    "SELECT LAST_INSERT_ID() AS next_val"
  );
  let next = row?.next_val != null ? Number(row.next_val) : 0;
  if (next > ORDER_NUMBER_MAX) {
    const err = new Error("Order number range exhausted (max 999999)");
    err.status = 503;
    throw err;
  }
  return next;
}

/** Addis Ababa bounds - server-side validation */
function isWithinAddis(lat, lng) {
  const { addisSouth, addisWest, addisNorth, addisEast } = env;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= addisSouth &&
    lat <= addisNorth &&
    lng >= addisWest &&
    lng <= addisEast
  );
}

function parseCoord(value) {
  if (value === undefined || value === null) return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/** Normalize object_type: trim, cap length; default "documents" if empty. */
const OBJECT_TYPE_MAX_LENGTH = 100;
function normalizeObjectType(value) {
  const s = (value || "").toString().trim();
  if (!s) return "documents";
  return s.length > OBJECT_TYPE_MAX_LENGTH ? s.slice(0, OBJECT_TYPE_MAX_LENGTH) : s;
}

function parsePositiveNumber(value) {
  if (value === undefined || value === null) return NaN;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/**
 * Get driving distance in km and three delivery plans with different prices.
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @param {number} dropoffLat
 * @param {number} dropoffLng
 * @returns {{ distanceKm: number, plans: { express, standard, same_day } }}
 */
async function estimate(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  const key = env.googleMapsApiKey;
  if (!key || key === "") {
    const err = new Error("GOOGLE_MAPS_API_KEY is not configured");
    err.status = 503;
    throw err;
  }

  const origins = `${pickupLat},${pickupLng}`;
  const destinations = `${dropoffLat},${dropoffLng}`;
  const url = new URL(DISTANCE_MATRIX_BASE);
  url.searchParams.set("origins", origins);
  url.searchParams.set("destinations", destinations);
  url.searchParams.set("key", key);
  url.searchParams.set("units", "metric");

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    const err = new Error(
      data.error_message || `Distance Matrix API error: ${data.status}`
    );
    err.status = 502;
    throw err;
  }

  const row = data.rows?.[0];
  const element = row?.elements?.[0];
  if (!element || element.status !== "OK") {
    const err = new Error(
      "Could not compute route between pickup and dropoff"
    );
    err.status = 400;
    throw err;
  }

  const distanceMeters = element.distance?.value;
  if (distanceMeters == null || distanceMeters < 0) {
    const err = new Error("Invalid distance returned");
    err.status = 502;
    throw err;
  }

  const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
  const round = (n) => Math.round(n * 100) / 100;
  const d = distanceKm;
  const R = 10; // 10 km radius threshold
  const R2 = 5;

  // Express (ፈጣን መልዕክት): base 200 + 18/km within 10 km, then 38/km beyond
  const expressPrice =
    d <= R2 ? 200 + 28 * d : d <= 12 ? 200 + 18 * d : 200 + 18 * R + 38 * (d - R);

    // const expressPrice =
    // d <= R ? 200 + 18 * d : 200 + 18 * R + 38 * (d - R);

  // Standard (መደበኛ መልዕክት): flat 200 within 10 km, then 15/km beyond
  const standardPrice = d <= R ? 200 : 200 + 15 * (d - R);

  // Same-day (በዕለቱ የሚደርስ): flat 80 within 10 km, then 10/km beyond
  const sameDayPrice = d <= R ? 80 : 80 + 10 * (d - R);

  const plans = {
    express: {
      price: round(expressPrice),
      eta: "within 2 hours",
    },
    standard: {
      price: round(standardPrice),
      eta: "within 6 hours",
    },
    same_day: {
      price: round(sameDayPrice),
      eta: "within 24 hours",
    },
  };
  return { distanceKm, plans };
}

/**
 * Get driver user ids within radius of (lat, lng) from Redis GEO.
 * Chunk 5 will populate drivers:geo with driver:location_update.
 */
async function getNearbyDriverUserIds(pickupLat, pickupLng) {
  try {
    const redis = await ensureRedisConnected();
    const lng = parseFloat(pickupLng);
    const lat = parseFloat(pickupLat);
    if (Number.isNaN(lng) || Number.isNaN(lat)) return [];

    // node-redis v5: geoRadius(key, { longitude, latitude }, radius, unit)
    const members =
      (await redis.geoRadius(
        DRIVERS_GEO_KEY,
        { longitude: lng, latitude: lat },
        NEARBY_RADIUS_KM,
        "km"
      )) || [];
    return Array.isArray(members) ? members.map(String) : [];
  } catch (err) {
    console.error("Redis GEORADIUS error:", err);
    return [];
  }
}

/**
 * Create delivery (user only), notify nearby drivers via Socket.IO.
 * Payment is always unpaid at creation; user pays later via Unpaid screen (pay-with-wallet).
 * @param {string} userId - User id (UUID string, JWT sub)
 * @param {object} body - { pickup: { lat, lng, address }, dropoff: { lat, lng, address }, object_type?, weight_kg?, description? }
 * @returns {{ delivery: Delivery, deliveryRequests: DeliveryRequest[] }}
 */
async function createDelivery(userId, body) {
  const pickup = body.pickup || {};
  const dropoff = body.dropoff || {};
  const pickupLat = parseCoord(pickup.lat);
  const pickupLng = parseCoord(pickup.lng);
  const dropoffLat = parseCoord(dropoff.lat);
  const dropoffLng = parseCoord(dropoff.lng);
  const pickupAddress = (pickup.address || "").toString().trim();
  const dropAddress = (dropoff.address || "").toString().trim();
  const pickupName = (pickup.name || "").toString().trim() || null;
  const dropName = (dropoff.name || "").toString().trim() || null;

  if (
    Number.isNaN(pickupLat) ||
    Number.isNaN(pickupLng) ||
    Number.isNaN(dropoffLat) ||
    Number.isNaN(dropoffLng)
  ) {
    const err = new Error(
      "pickup and dropoff must have lat/lng (numeric)"
    );
    err.status = 400;
    throw err;
  }

  if (!isWithinAddis(pickupLat, pickupLng)) {
    const err = new Error("Pickup location must be within Addis Ababa");
    err.status = 400;
    throw err;
  }
  if (!isWithinAddis(dropoffLat, dropoffLng)) {
    const err = new Error("Dropoff location must be within Addis Ababa");
    err.status = 400;
    throw err;
  }

  if (!pickupAddress || !dropAddress) {
    const err = new Error("pickup.address and dropoff.address are required");
    err.status = 400;
    throw err;
  }

  const validPlans = ["express", "standard", "same_day"];
  const deliveryPlan = (body.delivery_plan || "").toString().trim().toLowerCase() || null;
  const priceFromBody = body.price != null ? parseFloat(body.price) : NaN;

  if (!deliveryPlan || !validPlans.includes(deliveryPlan)) {
    const err = new Error("delivery_plan is required and must be express, standard, or same_day");
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(priceFromBody) || priceFromBody < 0) {
    const err = new Error("price is required and must be a valid positive number");
    err.status = 400;
    throw err;
  }

  const { distanceKm } = await estimate(
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng
  );

  const objectType = normalizeObjectType(body.object_type);
  const weightKg = parseFloat(body.weight_kg);
  const weightKgNum =
    Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 1;
  const description = (body.description || "").toString().trim() || null;

  let receiverName = (body.receiver_name || "").toString().trim() || null;
  let receiverPhone = (body.receiver_phone || "").toString().trim() || null;
  if ((!receiverName || !receiverPhone) && userId) {
    const user = await User.findByPk(userId);
    if (user) {
      if (!receiverName) receiverName = (user.name || "").toString().trim() || null;
      if (!receiverPhone) receiverPhone = (user.phone || "").toString().trim() || null;
    }
  }

  const deliveryId = newUuidBin();
  const orderNumber = await getNextDeliveryOrderNumber();
  const delivery = await Delivery.create({
    id: deliveryId,
    order_number: orderNumber,
    user_id: userId || null,
    driver_id: null,
    object_type: objectType,
    weight_kg: weightKgNum,
    description,
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    pickup_address: pickupAddress,
    pickup_name: pickupName,
    drop_lat: dropoffLat,
    drop_lng: dropoffLng,
    drop_address: dropAddress,
    drop_name: dropName,
    receiver_name: receiverName,
    receiver_phone: receiverPhone,
    delivery_plan: deliveryPlan,
    distance_km: distanceKm,
    price: priceFromBody,
    status: "pending",
  });

  let nearbyUserIds = await getNearbyDriverUserIds(pickupLat, pickupLng);
  if (process.env.NODE_ENV !== "production") {
    console.log("[createDelivery] nearby driver user ids from Redis:", nearbyUserIds.length, nearbyUserIds);
  }
  // Fallback: if no drivers in Redis (e.g. driver logged in after), use all drivers so requests exist for fetch
  if (nearbyUserIds.length === 0) {
    const allDrivers = await Driver.findAll({ attributes: ["user_id"] });
    nearbyUserIds = allDrivers.map((d) => String(d.user_id));
    if (process.env.NODE_ENV !== "production") {
      console.log("[createDelivery] fallback to all drivers:", nearbyUserIds.length);
    }
  }
  if (nearbyUserIds.length === 0) {
    return { delivery, deliveryRequests: [] };
  }
  const drivers = await Driver.findAll({
    where: { user_id: { [Op.in]: nearbyUserIds } },
    attributes: ["id", "user_id"],
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[createDelivery] Driver rows found:", drivers.length);
  }
  const driverByUserId = new Map(
    drivers.map((d) => [String(d.user_id), d])
  );

  const deliveryRequests = [];
  const io = getIo();

  for (const driverUserId of nearbyUserIds) {
    const driver = driverByUserId.get(String(driverUserId));
    if (!driver) continue;

    const requestId = newUuidBin();
    const dr = await DeliveryRequest.create({
      id: requestId,
      delivery_id: deliveryId,
      driver_id: driver.id,
      status: "sent",
    });
    deliveryRequests.push(dr);

    if (io) {
      io.to(`driver:${driverUserId}`).emit("driver:delivery_request", {
        deliveryRequestId: binToUuid(requestId),
        deliveryId: binToUuid(deliveryId),
        delivery: {
          pickup_address: pickupAddress,
          pickup_name: pickupName,
          drop_address: dropAddress,
          drop_name: dropName,
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          distance_km: distanceKm,
          price: priceFromBody,
          object_type: objectType,
        },
      });
      if (process.env.NODE_ENV !== "production") {
        console.log("[createDelivery] emitted driver:delivery_request to driver:", driverUserId);
      }
    }
  }

  return { delivery, deliveryRequests };
}

/**
 * Create outside-town delivery with manual pickup/dropoff and weight-based pricing.
 * No distance matrix or Addis-Ababa bounds; price = 350 + 110 * weight_kg, max 20 kg.
 * When options.allowCustomPrice is true (admin), client price is accepted as-is.
 */
async function createOutsideTownDelivery(userId, body, options = {}) {
  const allowCustomPrice = Boolean(options.allowCustomPrice);
  const rawPickupAddress = (body.pickup_address || "").toString().trim();
  const rawDropoffAddress = (body.dropoff_address || "").toString().trim();

  if (!rawPickupAddress || !rawDropoffAddress) {
    const err = new Error("pickup_address and dropoff_address are required");
    err.status = 400;
    throw err;
  }

  const weight = parsePositiveNumber(body.weight_kg);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 20) {
    const err = new Error("weight_kg must be a positive number not more than 20 kg");
    err.status = 400;
    throw err;
  }

  const expectedPrice = weight != 1 ? 350 + 110 * weight - 110 : 350;
  const priceFromBody = parsePositiveNumber(body.price);
  if (!Number.isFinite(priceFromBody)) {
    const err = new Error("price is required and must be a valid positive number");
    err.status = 400;
    throw err;
  }

  let priceToStore = expectedPrice;
  if (allowCustomPrice) {
    priceToStore = priceFromBody;
  } else {
    // Simple tamper check: ensure client price matches server formula within 0.5 ETB.
    const diff = Math.abs(expectedPrice - priceFromBody);
    if (diff > 0.5) {
      const err = new Error("Invalid price for given weight");
      err.status = 400;
      throw err;
    }
  }

  const objectType = normalizeObjectType(body.object_type);
  const description = (body.description || "").toString().trim() || null;

  let receiverName = (body.receiver_name || "").toString().trim() || null;
  let receiverPhone = (body.receiver_phone || "").toString().trim() || null;
  if ((!receiverName || !receiverPhone) && userId) {
    const user = await User.findByPk(userId);
    if (user) {
      if (!receiverName) receiverName = (user.name || "").toString().trim() || null;
      if (!receiverPhone) receiverPhone = (user.phone || "").toString().trim() || null;
    }
  }

  const deliveryId = newUuidBin();
  const orderNumber = await getNextDeliveryOrderNumber();
  const delivery = await Delivery.create({
    id: deliveryId,
    order_number: orderNumber,
    user_id: userId || null,
    driver_id: null,
    object_type: objectType,
    weight_kg: weight,
    description,
    pickup_lat: 0,
    pickup_lng: 0,
    pickup_address: rawPickupAddress,
    pickup_name: null,
    drop_lat: 0,
    drop_lng: 0,
    drop_address: rawDropoffAddress,
    drop_name: null,
    receiver_name: receiverName,
    receiver_phone: receiverPhone,
    delivery_plan: "outside_town",
    distance_km: 0,
    price: priceToStore,
    status: "pending",
  });

  // For now, outside-town deliveries are not auto-broadcasted to drivers.
  return { delivery, deliveryRequests: [] };
}

/**
 * Create delivery as admin. Same as createDelivery but with optional user_id (requester).
 * @param {object} body - { pickup, dropoff, object_type?, weight_kg?, description?, user_id? }
 * @returns {{ delivery: Delivery, deliveryRequests: DeliveryRequest[] }}
 */
async function createDeliveryByAdmin(body) {
  const userId = body.user_id || null;
  return createDelivery(userId, body);
}

/**
 * Get current driver location for an accepted delivery (user must own the delivery).
 * Uses Redis GEOPOS (driver location is stored by driver user_id).
 * @param {string} deliveryId - Delivery id (UUID string)
 * @param {string} userId - Caller user id (must be delivery.user_id)
 * @returns {{ lat: number, lng: number } | null }
 */
async function getDriverLocation(deliveryId, userId) {
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
  if (String(delivery.user_id) !== String(userId)) {
    const err = new Error("Not authorized to view this delivery");
    err.status = 403;
    throw err;
  }
  if (!delivery.driver_id) {
    const err = new Error("No driver assigned yet");
    err.status = 400;
    throw err;
  }

  const driver = delivery.Driver;
  if (!driver || !driver.user_id) {
    return null;
  }

  const redis = await ensureRedisConnected();
  const positions = await redis.geoPos(DRIVERS_GEO_KEY, String(driver.user_id));
  if (!positions || !positions[0] || positions[0].length < 2) {
    return null;
  }
  const [lng, lat] = positions[0];
  return { lat: Number(lat), lng: Number(lng) };
}

/** Ongoing statuses only; delivered/cancelled are excluded from active journey. */
const ACTIVE_STATUSES = ["pending", "accepted", "picked", "on_way"];

/**
 * Get current ongoing delivery for user or driver (single).
 * @param {string} userId - JWT sub (user id)
 * @param {string} role - "user" | "driver"
 * @returns {Promise<Delivery|null>}
 */
async function getActiveDelivery(userId, role) {
  const roleLower = (role && String(role).toLowerCase()) || "";
  const driverInclude = [
    {
      model: Driver,
      as: "Driver",
      required: false,
      include: [{ model: User, as: "User", attributes: ["name", "phone"] }],
    },
  ];
  if (roleLower === "user") {
    return Delivery.findOne({
      where: { user_id: userId, status: { [Op.in]: ACTIVE_STATUSES } },
      order: [["created_at", "DESC"]],
      include: driverInclude,
    });
  }
  if (roleLower === "driver") {
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) return null;
    return Delivery.findOne({
      where: { driver_id: driver.id, status: { [Op.in]: ACTIVE_STATUSES } },
      order: [["created_at", "DESC"]],
      include: driverInclude,
    });
  }
  return null;
}

/**
 * Get all ongoing deliveries for user (list); for driver returns all ongoing trips (up to 3).
 * @param {string} userId - JWT sub (user id)
 * @param {string} role - "user" | "driver"
 * @returns {Promise<Delivery[]>}
 */
async function getActiveDeliveries(userId, role) {
  const roleLower = (role && String(role).toLowerCase()) || "";
  const driverInclude = [
    {
      model: Driver,
      as: "Driver",
      required: false,
      include: [{ model: User, as: "User", attributes: ["name", "phone"] }],
    },
  ];
  if (roleLower === "user") {
    return Delivery.findAll({
      where: { user_id: userId, status: { [Op.in]: ACTIVE_STATUSES } },
      order: [["created_at", "DESC"]],
      include: driverInclude,
    });
  }
  if (roleLower === "driver") {
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) return [];
    return Delivery.findAll({
      where: { driver_id: driver.id, status: { [Op.in]: ACTIVE_STATUSES } },
      order: [["created_at", "ASC"]],
      include: driverInclude,
    });
  }
  return [];
}

/**
 * Update delivery status: user sets "picked" (journey start), driver sets "delivered" (journey end).
 * Notifies the other party via socket.
 */
async function updateDeliveryStatus(deliveryId, userId, role, newStatus) {
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

  const currentStatus = delivery.status;
  if (newStatus === "picked") {
    // Only the assigned driver can mark a delivery as picked.
    if (role !== "driver") {
      const err = new Error("Only the driver can mark delivery as picked");
      err.status = 403;
      throw err;
    }
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver || String(delivery.driver_id) !== String(driver.id)) {
      const err = new Error("Not authorized to update this delivery");
      err.status = 403;
      throw err;
    }
    if (currentStatus !== "accepted") {
      const err = new Error("Can only set picked when delivery is accepted");
      err.status = 400;
      throw err;
    }
  } else if (newStatus === "delivered") {
    if (role !== "driver") {
      const err = new Error("Only the driver can mark as delivered");
      err.status = 403;
      throw err;
    }
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver || String(delivery.driver_id) !== String(driver.id)) {
      const err = new Error("Not authorized to update this delivery");
      err.status = 403;
      throw err;
    }
    if (currentStatus !== "picked" && currentStatus !== "on_way") {
      const err = new Error("Can only set delivered when journey has started (picked or on_way)");
      err.status = 400;
      throw err;
    }
  } else if (newStatus === "cancelled") {
    if (role === "user") {
      if (String(delivery.user_id) !== String(userId)) {
        const err = new Error("Not authorized to update this delivery");
        err.status = 403;
        throw err;
      }
      const allowedUserCancel = ["pending", "accepted"].includes(currentStatus);
      if (!allowedUserCancel) {
        const err = new Error("User can only cancel when trip is not picked yet (pending or accepted)");
        err.status = 400;
        throw err;
      }
    } else if (role === "driver") {
      const driver = await Driver.findOne({ where: { user_id: userId } });
      if (!driver || String(delivery.driver_id) !== String(driver.id)) {
        const err = new Error("Not authorized to update this delivery");
        err.status = 403;
        throw err;
      }
      const allowedDriverCancel = ["accepted", "picked", "on_way"].includes(currentStatus);
      if (!allowedDriverCancel) {
        const err = new Error("Driver can only cancel when trip is accepted, picked, or on the way");
        err.status = 400;
        throw err;
      }
    } else {
      const err = new Error("Only the user or driver can cancel the trip");
      err.status = 403;
      throw err;
    }
  } else {
    const err = new Error("Invalid status transition");
    err.status = 400;
    throw err;
  }

  // Use delivery.id from DB so WHERE matches regardless of id column type (BINARY/CHAR)
  const [affectedCount] = await Delivery.update(
    { status: newStatus },
    { where: { id: delivery.id } }
  );
  if (affectedCount === 0) {
    const err = new Error("Failed to update delivery status in database");
    err.status = 500;
    throw err;
  }
  const updated = await Delivery.findByPk(delivery.id);
  const io = getIo();
  const deliveryPayload = {
    deliveryId: binToUuid(deliveryIdBin),
    status: newStatus,
    delivery: {
      id: binToUuid(delivery.id),
      status: newStatus,
      pickup_address: delivery.pickup_address,
      pickup_name: delivery.pickup_name,
      drop_address: delivery.drop_address,
      drop_name: delivery.drop_name,
      distance_km: delivery.distance_km,
      price: delivery.price,
    },
  };
  if (io) {
    io.to(`user:${delivery.user_id}`).emit("user:delivery_status_updated", deliveryPayload);
    const driverUserId = delivery.Driver?.user_id;
    if (driverUserId) {
      io.to(`driver:${driverUserId}`).emit("driver:delivery_status_updated", deliveryPayload);
    }
    // When cancelled, remove this request from all drivers' pending lists in real time.
    if (newStatus === "cancelled") {
      io.to("drivers").emit("driver:delivery_request_removed", {
        deliveryId: binToUuid(deliveryIdBin),
      });
    }
  }

  // Notify sender via SMS when driver marks as delivered (fire-and-forget)
  if (newStatus === "delivered" && delivery.user_id) {
    const senderUser = await User.findByPk(delivery.user_id, {
      attributes: ["phone"],
    });
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
      let driverName = null;
      let driverPhone = null;
      if (delivery.Driver?.user_id) {
        const driverUser = await User.findByPk(delivery.Driver.user_id, {
          attributes: ["name", "phone"],
        });
        if (driverUser) {
          driverName = driverUser.name;
          driverPhone = driverUser.phone;
        }
      }
      const weight = delivery.weight_kg != null ? Number(delivery.weight_kg) : null;
      const note = delivery.description && String(delivery.description).trim() ? String(delivery.description).trim() : null;
      const orderNum = String(delivery.order_number ?? 0).padStart(6, "0");
      const parts = [
        `Order #${orderNum}.`,
        "Your delivery has been delivered.",
        `Driver: ${driverName || "—"}. Contact: ${driverPhone || "—"}.`,
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
      const receiverName =
        delivery.receiver_name && String(delivery.receiver_name).trim()
          ? String(delivery.receiver_name).trim()
          : null;
      const receiverPhone =
        delivery.receiver_phone && String(delivery.receiver_phone).trim()
          ? String(delivery.receiver_phone).trim()
          : null;
      if (receiverName || receiverPhone) {
        parts.push(
          `Receiver: ${[receiverName, receiverPhone].filter(Boolean).join(" ")}`
        );
      }
      const smsMessage = parts.join(" ");
      afromessage
        .sendSms(senderUser.phone, smsMessage)
        .catch((err) =>
          console.error("SMS to sender after delivered failed:", err.message)
        );
    }
  }

  return updated;
}

/**
 * Admin can set any valid delivery status, bypassing role/transition checks.
 * Still emits socket events so user/driver apps get notified.
 */
const VALID_STATUSES = ["pending", "accepted", "picked", "on_way", "delivered", "cancelled"];
async function updateDeliveryStatusByAdmin(deliveryId, newStatus) {
  const statusLower = (newStatus || "").toString().toLowerCase().trim();
  if (!VALID_STATUSES.includes(statusLower)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
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
    include: [{ model: Driver, as: "Driver", attributes: ["id", "user_id"] }],
  });
  if (!delivery) {
    const err = new Error("Delivery not found");
    err.status = 404;
    throw err;
  }

  const [affectedCount] = await Delivery.update(
    { status: statusLower },
    { where: { id: delivery.id } }
  );
  if (affectedCount === 0) {
    const err = new Error("Failed to update delivery status in database");
    err.status = 500;
    throw err;
  }

  const io = getIo();
  const deliveryPayload = {
    deliveryId: binToUuid(deliveryIdBin),
    status: statusLower,
    delivery: {
      id: binToUuid(delivery.id),
      status: statusLower,
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
      io.to(`user:${delivery.user_id}`).emit("user:delivery_status_updated", deliveryPayload);
    }
    const driverUserId = delivery.Driver?.user_id;
    if (driverUserId) {
      io.to(`driver:${driverUserId}`).emit("driver:delivery_status_updated", deliveryPayload);
    }
    if (statusLower === "cancelled") {
      io.to("drivers").emit("driver:delivery_request_removed", {
        deliveryId: binToUuid(deliveryIdBin),
      });
    }
  }

  // Notify sender via SMS when admin marks as delivered (fire-and-forget)
  if (statusLower === "delivered" && delivery.user_id) {
    const senderUser = await User.findByPk(delivery.user_id, {
      attributes: ["phone"],
    });
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
      let driverName = null;
      let driverPhone = null;
      if (delivery.driver_id) {
        const driver = await Driver.findByPk(delivery.driver_id, {
          include: [{ model: User, as: "User", attributes: ["name", "phone"] }],
        });
        if (driver?.User) {
          driverName = driver.User.name;
          driverPhone = driver.User.phone;
        }
      }
      const weight = delivery.weight_kg != null ? Number(delivery.weight_kg) : null;
      const note = delivery.description && String(delivery.description).trim() ? String(delivery.description).trim() : null;
      const orderNum = String(delivery.order_number ?? 0).padStart(6, "0");
      const parts = [
        `Order #${orderNum}.`,
        "Your delivery has been delivered.",
        `Driver: ${driverName || "—"}. Contact: ${driverPhone || "—"}.`,
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
      const receiverName =
        delivery.receiver_name && String(delivery.receiver_name).trim()
          ? String(delivery.receiver_name).trim()
          : null;
      const receiverPhone =
        delivery.receiver_phone && String(delivery.receiver_phone).trim()
          ? String(delivery.receiver_phone).trim()
          : null;
      if (receiverName || receiverPhone) {
        parts.push(
          `Receiver: ${[receiverName, receiverPhone].filter(Boolean).join(" ")}`
        );
      }
      const smsMessage = parts.join(" ");
      afromessage
        .sendSms(senderUser.phone, smsMessage)
        .catch((err) =>
          console.error("SMS to sender after admin delivered failed:", err.message)
        );
    }
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
  });
  const data = updated.toJSON ? updated.toJSON() : updated;
  const idStrOut = updated.id && Buffer.isBuffer(updated.id) ? binToUuid(updated.id) : updated.id;
  return { delivery: { ...data, id: idStrOut } };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Mark delivery as paid (driver received cash). Driver only; delivery must be delivered and unpaid.
 * Computes driver_commission_amount and amount_due_to_admin from driver_type and price.
 */
async function markDeliveryPaid(deliveryId, userId) {
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
    const err = new Error("Can only mark payment when delivery status is delivered");
    err.status = 400;
    throw err;
  }
  if (!delivery.driver_id) {
    const err = new Error("Delivery has no assigned driver");
    err.status = 400;
    throw err;
  }
  if (delivery.payment === "paid") {
    const err = new Error("Delivery is already marked as paid");
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findOne({ where: { user_id: userId } });
  if (!driver || String(delivery.driver_id) !== String(driver.id)) {
    const err = new Error("Not authorized to update this delivery");
    err.status = 403;
    throw err;
  }

  const rates = await SettingsService.getCommissionRates();
  const driverType = (delivery.Driver?.driver_type || driver.driver_type || "freelancer").toLowerCase();
  const rate = rates[driverType] ?? rates.freelancer;
  const price = parseFloat(delivery.price) || 0;
  const driverCommissionAmount = round2(price * rate);
  const amountDueToAdmin = round2(price - driverCommissionAmount);

  await delivery.update({
    payment: "paid",
    driver_commission_amount: driverCommissionAmount,
    amount_due_to_admin: amountDueToAdmin,
  });

  return delivery;
}

/**
 * User pays a delivered unpaid delivery with wallet. User only; delivery must belong to user, be delivered and unpaid.
 * Debits wallet and sets payment + driver commission in one transaction.
 */
async function payDeliveryWithWallet(deliveryId, userId) {
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

  if (String(delivery.user_id) !== String(userId)) {
    const err = new Error("Not authorized to pay this delivery");
    err.status = 403;
    throw err;
  }
  if (delivery.status !== "delivered") {
    const err = new Error("Can only pay when delivery status is delivered");
    err.status = 400;
    throw err;
  }
  if (delivery.payment === "paid") {
    const err = new Error("Delivery is already paid");
    err.status = 400;
    throw err;
  }
  if (!delivery.driver_id) {
    const err = new Error("Delivery has no assigned driver");
    err.status = 400;
    throw err;
  }

  const price = parseFloat(delivery.price) || 0;
  if (price <= 0) {
    const err = new Error("Invalid delivery price");
    err.status = 400;
    throw err;
  }
  const roundedPrice = round2(price);
  const balance = await WalletService.getUserWalletBalance(userId);
  if (balance < roundedPrice) {
    const err = new Error("Insufficient wallet balance");
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

  const updated = await Delivery.findByPk(delivery.id);
  return updated;
}

/** Statuses that indicate a finished delivery (history). */
const HISTORY_STATUSES = ["delivered", "cancelled"];

/**
 * Get past deliveries (delivered or cancelled) for user or driver.
 * @param {string} userId - JWT sub
 * @param {string} role - "user" | "driver"
 * @param {{ limit?: number }} opts - optional limit (default 50)
 * @returns {Promise<Delivery[]>}
 */
async function getDeliveryHistory(userId, role, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const roleLower = (role && String(role).toLowerCase()) || "";
  if (roleLower === "user") {
    return Delivery.findAll({
      where: { user_id: userId, status: { [Op.in]: HISTORY_STATUSES } },
      order: [["created_at", "DESC"]],
      limit,
    });
  }
  if (roleLower === "driver") {
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) return [];
    return Delivery.findAll({
      where: { driver_id: driver.id, status: { [Op.in]: HISTORY_STATUSES } },
      order: [["created_at", "DESC"]],
      limit,
    });
  }
  return [];
}

module.exports = {
  estimate,
  createDelivery,
  createDeliveryByAdmin,
  createOutsideTownDelivery,
  getDriverLocation,
  getActiveDelivery,
  getActiveDeliveries,
  getDeliveryHistory,
  updateDeliveryStatus,
  updateDeliveryStatusByAdmin,
  markDeliveryPaid,
  payDeliveryWithWallet,
  isWithinAddis,
};
