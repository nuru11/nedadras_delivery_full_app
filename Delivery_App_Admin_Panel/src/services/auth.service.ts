import api from "../lib/api";
import type { AdminRole } from "../utils/adminPermissions";

export interface AdminUser {
  id: string;
  username: string;
  name?: string | null;
  adminRole: AdminRole;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export const adminLogin = async (
  username: string,
  password: string
): Promise<AdminLoginResponse> => {
  const { data } = await api.post<AdminLoginResponse>("/auth/admin/login", {
    username: username.trim(),
    password,
  });
  return data;
};
