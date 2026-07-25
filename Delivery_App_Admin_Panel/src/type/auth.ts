export interface AdminUser {
  id: string;
  phone: string;
  role: string;
  name?: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}
