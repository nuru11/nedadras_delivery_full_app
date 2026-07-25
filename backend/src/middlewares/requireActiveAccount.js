const User = require("../modules/users/user.model");

/**
 * Ensures that the authenticated user's account is active.
 * - Requires jwtMiddleware to have already populated req.user.{sub, role}.
 * - Admins are always allowed.
 * - For role 'user' or 'driver', rejects if user.status !== 'active'.
 */
module.exports = async function requireActiveAccount(req, res, next) {
  try {
    const userId = req.user?.sub;
    const role = (req.user?.role || "").toLowerCase();

    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }

    // Admins are always allowed regardless of status.
    if (role === "admin") {
      return next();
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Account is not active. Please contact support." });
    }

    return next();
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to validate account status";
    return res.status(status).json({ message });
  }
};

