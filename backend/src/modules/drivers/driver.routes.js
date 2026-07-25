const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireDriver = require("../../middlewares/requireDriver");
const { upload } = require("./driver.upload");
const DriverController = require("./driver.controller");

const router = Router();

router.post(
  "/kyc",
  jwtMiddleware,
  requireDriver,
  upload,
  DriverController.submitKyc
);

module.exports = router;
