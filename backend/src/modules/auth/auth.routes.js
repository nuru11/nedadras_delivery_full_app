const { Router } = require("express");
const AuthController = require("./auth.controller");
const jwtMiddleware = require("../../middlewares/jwt");

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/login/verify", AuthController.verifyLogin);
router.post("/request-otp", AuthController.requestOtp);
router.post("/verify-otp", AuthController.verifyOtp);

// Current authenticated user (used by mobile app to refresh status/kyc)
router.get("/me", jwtMiddleware, AuthController.me);
router.delete("/me", jwtMiddleware, AuthController.deleteMe);

// Admin panel: username + password (dedicated admins table)
router.post("/admin/login", AuthController.adminLogin);

module.exports = router;
