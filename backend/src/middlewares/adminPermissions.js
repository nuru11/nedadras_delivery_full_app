/**
 * Admin sub-role → permission map for panel RBAC.
 * JWT still has role: "admin"; adminRole holds the sub-role.
 */

const ROLE_PERMISSIONS = {
  super_admin: [
    "dashboard:read",
    "users:read",
    "users:write",
    "drivers:read",
    "drivers:write",
    "deliveries:read",
    "deliveries:write",
    "deliveries:payment",
    "wallet:read",
    "wallet:deposit",
    "settlements:read",
    "settlements:write",
    "payments:summary",
    "commission:read",
    "commission:write",
    "places:use",
    "admins:manage",
  ],
  operations: [
    "dashboard:read",
    "users:read",
    "users:write",
    "drivers:read",
    "drivers:write",
    "deliveries:read",
    "deliveries:write",
    "deliveries:payment",
    "places:use",
  ],
  finance: [
    "dashboard:read",
    "users:read",
    "drivers:read",
    "deliveries:read",
    "deliveries:payment",
    "wallet:read",
    "wallet:deposit",
    "settlements:read",
    "settlements:write",
    "payments:summary",
  ],
};

function permissionsForRole(adminRole) {
  return ROLE_PERMISSIONS[adminRole] || [];
}

function hasPermission(adminRole, permission) {
  return permissionsForRole(adminRole).includes(permission);
}

/**
 * Requires that req.user.adminRole has every listed permission.
 * Use after jwtMiddleware + requireAdmin.
 */
function requirePermission(...permissions) {
  return function requirePermissionMiddleware(req, res, next) {
    const adminRole = req.user?.adminRole;
    if (!adminRole) {
      return res.status(403).json({ message: "Admin role required" });
    }
    for (const permission of permissions) {
      if (!hasPermission(adminRole, permission)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
    }
    return next();
  };
}

module.exports = {
  ROLE_PERMISSIONS,
  permissionsForRole,
  hasPermission,
  requirePermission,
};
