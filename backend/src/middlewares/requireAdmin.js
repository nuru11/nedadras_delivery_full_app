/**
 * Requires req.user.role === "admin". Use after jwtMiddleware.
 * Returns 403 if not admin.
 */
module.exports = function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};
