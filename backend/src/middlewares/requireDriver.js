/**
 * Requires req.user.role === "driver". Use after jwtMiddleware.
 * Returns 403 if not driver.
 */
module.exports = function requireDriver(req, res, next) {
  if (req.user?.role !== "driver") {
    return res.status(403).json({ message: "Driver access required" });
  }
  return next();
};
