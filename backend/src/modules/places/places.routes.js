const { Router } = require("express");
const jwtMiddleware = require("../../middlewares/jwt");
const requireAdmin = require("../../middlewares/requireAdmin");
const { requirePermission } = require("../../middlewares/adminPermissions");
const PlacesController = require("./places.controller");

const router = Router();

router.use(jwtMiddleware);
router.use(requireAdmin);
router.use(requirePermission("places:use"));

router.get("/autocomplete", PlacesController.autocomplete);
router.get("/details", PlacesController.details);

module.exports = router;
