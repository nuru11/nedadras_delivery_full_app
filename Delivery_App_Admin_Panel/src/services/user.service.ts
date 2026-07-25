import api from "../lib/api";

export interface User {
  id: string;
  name: string;
  phone: string;
}

export interface AdminUser extends User {
  role: string;
  status?: "pending" | "active" | "inactive";
  created_at: string;
}

export interface GetAllUsersResponse {
  users: AdminUser[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

export const getUsers = async (): Promise<{ users: User[] }> => {
  const { data } = await api.get<{ users: User[] }>("/admin/users");
  return data;
};

export const getAllUsers = async (
  page: number = 1,
  limit: number = 20
): Promise<GetAllUsersResponse> => {
  const { data } = await api.get<GetAllUsersResponse>("/admin/all-users", {
    params: { page, limit },
  });
  return data;
};

export const updateUserStatus = async (
  id: string,
  status: AdminUser["status"]
): Promise<AdminUser> => {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/status`, {
    status,
  });
  return data;
};

export const createUser = async (
  name: string,
  phone: string
): Promise<AdminUser> => {
  const { data } = await api.post<AdminUser>("/admin/users", { name, phone });
  return data;
};
