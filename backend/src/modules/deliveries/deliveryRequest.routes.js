const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireActiveAccount = require("../../middlewares/requireActiveAccount");
const DeliveryRequestController = require("./deliveryRequest.controller");

const router = Router();

router.get(
  "/pending",
  jwtMiddleware,
  requireActiveAccount,
  DeliveryRequestController.getPending
);

router.post(
  "/:id/accept",
  jwtMiddleware,
  requireActiveAccount,
  DeliveryRequestController.accept
);

router.post(
  "/:id/reject",
  jwtMiddleware,
  requireActiveAccount,
  DeliveryRequestController.reject
);

module.exports = router;
