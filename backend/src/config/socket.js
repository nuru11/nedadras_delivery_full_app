const { Server } = require("socket.io");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const env = require("./env");
const { ensureRedisConnected } = require("./redis");
const Driver = require("../modules/drivers/driver.model");
const Delivery = require("../modules/deliveries/delivery.model");
const { binToUuid } = require("../utils/uuid");

const DRIVERS_GEO_KEY = "drivers:geo";
const ACTIVE_DELIVERY_STATUSES = ["accepted", "picked", "on_way"];

let ioInstance = null;

function getIo() {
  return ioInstance;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    // cPanel/shared hosting: allow polling (works when WebSocket is blocked)
    transports: ["polling", "websocket"],
    // Slower proxies may need longer timeouts
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || "").split(" ")[1] ||
        socket.handshake.query?.token;

      if (!token) {
        console.warn("[Socket] Rejected: Missing auth token");
        return next(new Error("Missing auth token"));
      }

      if (!env.jwtSecret) {
        console.warn("[Socket] Rejected: JWT_SECRET not configured");
        return next(new Error("JWT secret not configured"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      socket.user = decoded;
      return next();
    } catch (e) {
      console.warn("[Socket] Rejected:", e.message || "Invalid or expired token");
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.sub;
    const role = socket.user?.role;

    if (userId) {
      socket.join(`user:${userId}`);
      if (role === "driver") {
        socket.join(`driver:${userId}`);
        socket.join("drivers"); // Broadcast room: notify all drivers when one accepts

        // Driver: update Redis GEO on location_update (every ~5s from client)
        socket.on("driver:location_update", async (data) => {
          const lat = data?.lat != null ? Number(data.lat) : NaN;
          const lng = data?.lng != null ? Number(data.lng) : NaN;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          try {
            const redis = await ensureRedisConnected();
            await redis.geoAdd(DRIVERS_GEO_KEY, {
              longitude: lng,
              latitude: lat,
              member: userId,
            });
            // Notify users tracking this driver (active deliveries)
            const driver = await Driver.findOne({ where: { user_id: userId } });
            if (driver) {
              const deliveries = await Delivery.findAll({
                where: { driver_id: driver.id, status: { [Op.in]: ACTIVE_DELIVERY_STATUSES } },
                attributes: ["id", "user_id"],
              });
              for (const d of deliveries) {
                const deliveryIdStr = d.id && Buffer.isBuffer(d.id) ? binToUuid(d.id) : d.id;
                io.to(`user:${d.user_id}`).emit("user:driver_location", {
                  deliveryId: deliveryIdStr,
                  lat,
                  lng,
                });
              }
            }
          } catch (err) {
            console.error("Redis GEOADD error:", err);
          }
        });
      }
    }
  });

  ioInstance = io;
  return io;
}

module.exports = { initSocket, getIo };

