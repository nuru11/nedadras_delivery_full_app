const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const deliveryRoutes = require("../modules/deliveries/delivery.routes");
const deliveryRequestRoutes = require("../modules/deliveries/deliveryRequest.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const placesRoutes = require("../modules/places/places.routes");
const driverRoutes = require("../modules/drivers/driver.routes");
const walletRoutes = require("../modules/wallet/wallet.routes");

const router = Router();

router.get("/", (req, res) =>
  res.status(200).json({
    message: "Delivery API",
    version: "1.0",
    endpoints: {
      health: "GET /api/health",
      auth: "/api/auth",
      deliveries: "/api/deliveries",
      deliveryRequests: "/api/delivery-requests",
      admin: "/api/admin",
      places: "/api/places",
      drivers: "/api/drivers",
      wallet: "/api/wallet",
    },
  })
);

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/delivery-requests", deliveryRequestRoutes);
router.use("/admin", adminRoutes);
router.use("/drivers", driverRoutes);
router.use("/wallet", walletRoutes);

router.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
);

module.exports = router;
