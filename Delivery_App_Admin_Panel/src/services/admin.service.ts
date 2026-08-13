import api from "../lib/api";
import type { AdminRole } from "../utils/adminPermissions";

export interface PanelAdmin {
  id: string;
  username: string;
  name?: string | null;
  adminRole: AdminRole;
  created_at?: string;
}

export async function listAdmins(): Promise<{ admins: PanelAdmin[] }> {
  const { data } = await api.get<{ admins: PanelAdmin[] }>("/admin/admins");
  return data;
}

export async function createAdmin(body: {
  username: string;
  password: string;
  name?: string;
  adminRole: AdminRole;
}): Promise<{ admin: PanelAdmin }> {
  const { data } = await api.post<{ admin: PanelAdmin }>("/admin/admins", {
    username: body.username,
    password: body.password,
    name: body.name,
    admin_role: body.adminRole,
  });
  return data;
}

export async function updateAdmin(
  id: string,
  body: { name?: string | null; adminRole?: AdminRole }
): Promise<{ admin: PanelAdmin }> {
  const { data } = await api.patch<{ admin: PanelAdmin }>(`/admin/admins/${id}`, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.adminRole !== undefined && { admin_role: body.adminRole }),
  });
  return data;
}

export async function updateAdminPassword(
  id: string,
  password: string
): Promise<{ ok: boolean }> {
  const { data } = await api.patch<{ ok: boolean }>(
    `/admin/admins/${id}/password`,
    { password }
  );
  return data;
}
