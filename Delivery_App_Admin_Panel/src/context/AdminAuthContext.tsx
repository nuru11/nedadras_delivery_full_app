import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentAdmin, type AdminUser } from "../services/auth.service";
import { getToken, isAuthenticated, logout as clearAuthStorage } from "../utils/auth";
import {
  can as canWithRole,
  getAuthUser,
  type AdminPermission,
  type AdminRole,
} from "../utils/adminPermissions";

type AdminAuthContextValue = {
  user: AdminUser | null;
  adminRole: AdminRole | null;
  ready: boolean;
  can: (permission: AdminPermission) => boolean;
  setSession: (token: string, user: AdminUser) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined
);

function normalizeUser(raw: {
  id: string;
  username: string;
  name?: string | null;
  adminRole?: string;
}): AdminUser | null {
  const role = raw.adminRole;
  if (role !== "super_admin" && role !== "operations" && role !== "finance") {
    return {
      id: raw.id,
      username: raw.username,
      name: raw.name ?? null,
      adminRole: "operations",
    };
  }
  return {
    id: raw.id,
    username: raw.username,
    name: raw.name ?? null,
    adminRole: role,
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = getAuthUser();
    return stored ? normalizeUser(stored) : null;
  });
  const [ready, setReady] = useState(false);

  const persistUser = useCallback((next: AdminUser | null) => {
    setUser(next);
    if (next) {
      localStorage.setItem("auth_user", JSON.stringify(next));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, []);

  const setSession = useCallback(
    (token: string, nextUser: AdminUser) => {
      localStorage.setItem("auth_token", token);
      const normalized = normalizeUser(nextUser) ?? nextUser;
      persistUser(normalized);
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getToken() || !isAuthenticated()) {
      persistUser(null);
      return;
    }
    try {
      const me = await fetchCurrentAdmin();
      const normalized = normalizeUser(me);
      if (normalized) persistUser(normalized);
    } catch (err) {
      console.error("Failed to refresh admin session:", err);
      // Keep local user if /me fails transiently; token expiry handled elsewhere
    }
  }, [persistUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated()) {
        if (!cancelled) {
          persistUser(null);
          setReady(true);
        }
        return;
      }
      try {
        const me = await fetchCurrentAdmin();
        if (!cancelled) {
          const normalized = normalizeUser(me);
          if (normalized) persistUser(normalized);
        }
      } catch (err) {
        console.error("Failed to load admin /me:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persistUser]);

  const adminRole = user?.adminRole ?? null;

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      adminRole,
      ready,
      can: (permission: AdminPermission) => canWithRole(permission, adminRole),
      setSession,
      refreshMe,
      logout,
    }),
    [user, adminRole, ready, setSession, refreshMe, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
