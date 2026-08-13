const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireAdmin = require("../../middlewares/requireAdmin");
const { requirePermission } = require("../../middlewares/adminPermissions");
const AdminController = require("./admin.controller");

const router = Router();

router.use(jwtMiddleware);
router.use(requireAdmin);

router.get(
  "/dashboard/overview",
  requirePermission("dashboard:read"),
  AdminController.getDashboardOverview
);

router.get("/users", requirePermission("users:read"), AdminController.getUsers);
router.get(
  "/all-users",
  requirePermission("users:read"),
  AdminController.getAllUsers
);
router.post(
  "/users",
  requirePermission("users:write"),
  AdminController.createUser
);
router.patch(
  "/users/:id/status",
  requirePermission("users:write"),
  AdminController.updateUserStatus
);
router.get(
  "/users/:id/wallet",
  requirePermission("wallet:read"),
  AdminController.getUserWallet
);
router.post(
  "/users/:id/wallet/deposit",
  requirePermission("wallet:deposit"),
  AdminController.depositToUserWallet
);

router.get(
  "/drivers",
  requirePermission("drivers:read"),
  AdminController.getDrivers
);
router.patch(
  "/drivers/:id/status",
  requirePermission("drivers:write"),
  AdminController.updateDriverStatus
);
router.patch(
  "/drivers/:id/type",
  requirePermission("drivers:write"),
  AdminController.updateDriverType
);

router.get(
  "/deliveries",
  requirePermission("deliveries:read"),
  AdminController.getDeliveries
);
router.post(
  "/deliveries",
  requirePermission("deliveries:write"),
  AdminController.createDelivery
);
router.post(
  "/deliveries/outside-town",
  requirePermission("deliveries:write"),
  AdminController.createOutsideTownDelivery
);
router.post(
  "/deliveries/:id/assign",
  requirePermission("deliveries:write"),
  AdminController.assignDelivery
);
router.patch(
  "/deliveries/:id/status",
  requirePermission("deliveries:write"),
  AdminController.updateDeliveryStatus
);
router.patch(
  "/deliveries/:id/payment",
  requirePermission("deliveries:payment"),
  AdminController.updateDeliveryPayment
);
router.patch(
  "/deliveries/:id/remark",
  requirePermission("deliveries:write"),
  AdminController.updateDeliveryRemark
);

router.post(
  "/settlements",
  requirePermission("settlements:write"),
  AdminController.createSettlement
);
router.get(
  "/settlements",
  requirePermission("settlements:read"),
  AdminController.getSettlements
);
router.get(
  "/drivers/:id/payment-summary",
  requirePermission("payments:summary"),
  AdminController.getDriverPaymentSummary
);
router.get(
  "/payment-summary",
  requirePermission("payments:summary"),
  AdminController.getAllDriversPaymentSummary
);

router.get(
  "/commission-rates",
  requirePermission("commission:read"),
  AdminController.getCommissionRates
);
router.patch(
  "/commission-rates",
  requirePermission("commission:write"),
  AdminController.updateCommissionRates
);

router.get(
  "/admins",
  requirePermission("admins:manage"),
  AdminController.listAdmins
);
router.post(
  "/admins",
  requirePermission("admins:manage"),
  AdminController.createAdmin
);
router.patch(
  "/admins/:id",
  requirePermission("admins:manage"),
  AdminController.updateAdmin
);
router.patch(
  "/admins/:id/password",
  requirePermission("admins:manage"),
  AdminController.updateAdminPassword
);

module.exports = router;
