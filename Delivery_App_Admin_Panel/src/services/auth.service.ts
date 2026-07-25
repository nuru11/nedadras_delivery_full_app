import api from "../lib/api";

export interface AdminUser {
  id: string;
  username: string;
  name?: string | null;
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
