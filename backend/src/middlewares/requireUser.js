/**
 * Requires req.user.role === "user". Use after jwtMiddleware.
 * Returns 403 if not user (e.g. driver or admin).
 */
module.exports = function requireUser(req, res, next) {
  if (req.user?.role !== "user") {
    return res.status(403).json({ message: "User access required" });
  }
  return next();
};
