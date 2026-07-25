const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireAdmin = require("../../middlewares/requireAdmin");
const AdminController = require("./admin.controller");

const router = Router();

router.use(jwtMiddleware);
router.use(requireAdmin);

router.get("/dashboard/overview", AdminController.getDashboardOverview);
router.get("/users", AdminController.getUsers);
router.get("/all-users", AdminController.getAllUsers);
router.post("/users", AdminController.createUser);
router.get("/drivers", AdminController.getDrivers);
router.get("/deliveries", AdminController.getDeliveries);
router.post("/deliveries", AdminController.createDelivery);
router.post("/deliveries/outside-town", AdminController.createOutsideTownDelivery);
router.patch("/deliveries/:id/payment", AdminController.updateDeliveryPayment);
router.patch("/deliveries/:id/remark", AdminController.updateDeliveryRemark);
router.post("/deliveries/:id/assign", AdminController.assignDelivery);
router.patch("/deliveries/:id/status", AdminController.updateDeliveryStatus);
router.patch("/drivers/:id/status", AdminController.updateDriverStatus);
router.patch("/drivers/:id/type", AdminController.updateDriverType);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.post("/settlements", AdminController.createSettlement);
router.get("/settlements", AdminController.getSettlements);
router.get("/drivers/:id/payment-summary", AdminController.getDriverPaymentSummary);
router.get("/payment-summary", AdminController.getAllDriversPaymentSummary);
router.get("/users/:id/wallet", AdminController.getUserWallet);
router.post("/users/:id/wallet/deposit", AdminController.depositToUserWallet);
router.get("/commission-rates", AdminController.getCommissionRates);
router.patch("/commission-rates", AdminController.updateCommissionRates);

module.exports = router;
