export type AdminRole = "super_admin" | "operations" | "finance";

export type AdminPermission =
  | "dashboard:read"
  | "users:read"
  | "users:write"
  | "drivers:read"
  | "drivers:write"
  | "deliveries:read"
  | "deliveries:write"
  | "deliveries:payment"
  | "wallet:read"
  | "wallet:deposit"
  | "settlements:read"
  | "settlements:write"
  | "payments:summary"
  | "commission:read"
  | "commission:write"
  | "places:use"
  | "admins:manage";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
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

export function permissionsForRole(role: string | null | undefined): AdminPermission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) return [];
  return ROLE_PERMISSIONS[role as AdminRole];
}

export function can(permission: AdminPermission, role?: string | null): boolean {
  const adminRole = role ?? getStoredAdminRole();
  return permissionsForRole(adminRole).includes(permission);
}

export function getStoredAdminRole(): AdminRole | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    const user = JSON.parse(raw) as { adminRole?: string };
    const role = user.adminRole;
    if (role === "super_admin" || role === "operations" || role === "finance") {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAuthUser(): {
  id: string;
  username: string;
  name?: string | null;
  adminRole?: AdminRole;
} | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "operations":
      return "Operations";
    case "finance":
      return "Finance";
    default:
      return role || "Unknown";
  }
}
