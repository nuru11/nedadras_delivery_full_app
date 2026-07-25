const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const DeliveryController = require("./delivery.controller");
const requireActiveAccount = require("../../middlewares/requireActiveAccount");
const requireDriver = require("../../middlewares/requireDriver");
const requireUser = require("../../middlewares/requireUser");

const router = Router();

router.post("/estimate", jwtMiddleware, DeliveryController.estimate);
router.post("/", jwtMiddleware, requireActiveAccount, DeliveryController.create);
router.post(
  "/outside-town",
  jwtMiddleware,
  requireActiveAccount,
  (req, res) => DeliveryController.createOutsideTown(req, res)
);
router.get("/active", jwtMiddleware, DeliveryController.getActive);
router.get("/active-list", jwtMiddleware, DeliveryController.getActiveList);
router.get("/history", jwtMiddleware, DeliveryController.getHistory);
router.get("/me/payment-summary", jwtMiddleware, requireActiveAccount, requireDriver, DeliveryController.getMyPaymentSummary);
router.get("/:id/driver-location", jwtMiddleware, DeliveryController.getDriverLocation);
router.patch("/:id/status", jwtMiddleware, requireActiveAccount, DeliveryController.updateStatus);
router.patch("/:id/payment", jwtMiddleware, requireActiveAccount, requireDriver, DeliveryController.updatePayment);
router.post("/:id/pay-with-wallet", jwtMiddleware, requireActiveAccount, requireUser, DeliveryController.payWithWallet);

module.exports = router;
