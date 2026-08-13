import { Navigate, Outlet, useLocation } from "react-router-dom";
import { can, type AdminPermission } from "../utils/adminPermissions";

const ROUTE_PERMISSIONS: { prefix: string; permission: AdminPermission }[] = [
  { prefix: "/admins", permission: "admins:manage" },
  { prefix: "/settings/commission-rates", permission: "commission:read" },
  { prefix: "/payments/settlements", permission: "settlements:read" },
  { prefix: "/payments/summary", permission: "payments:summary" },
  { prefix: "/payments/driver", permission: "payments:summary" },
  { prefix: "/basic-tables", permission: "users:read" },
  { prefix: "/users/", permission: "users:read" },
  { prefix: "/drivers", permission: "drivers:read" },
  { prefix: "/trips-history", permission: "deliveries:read" },
  { prefix: "/ongoing-journeys", permission: "deliveries:read" },
  { prefix: "/trips", permission: "deliveries:read" },
];

function requiredPermissionForPath(pathname: string): AdminPermission | null {
  if (pathname === "/") return "dashboard:read";
  const match = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`) || pathname.startsWith(r.prefix)
  );
  return match?.permission ?? null;
}

/**
 * Use inside authenticated layout. Redirects to / when role lacks route permission.
 */
export default function PermissionRoute() {
  const location = useLocation();
  const permission = requiredPermissionForPath(location.pathname);

  if (permission && !can(permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
