const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireUser = require("../../middlewares/requireUser");
const WalletController = require("./wallet.controller");

const router = Router();

router.get("/me", jwtMiddleware, requireUser, WalletController.getMyWallet);

module.exports = router;
