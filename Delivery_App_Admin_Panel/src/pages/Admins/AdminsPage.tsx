import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  createAdmin,
  listAdmins,
  PanelAdmin,
  updateAdmin,
  updateAdminPassword,
} from "../../services/admin.service";
import type { AdminRole } from "../../utils/adminPermissions";

const ROLE_OPTIONS: AdminRole[] = ["super_admin", "operations", "finance"];

function roleLabel(role: string) {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "operations":
      return "Operations";
    case "finance":
      return "Finance";
    default:
      return role;
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<PanelAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    name: "",
    adminRole: "operations" as AdminRole,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editAdmin, setEditAdmin] = useState<PanelAdmin | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AdminRole>("operations");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [passwordAdmin, setPasswordAdmin] = useState<PanelAdmin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdmins();
      setAdmins(data.admins ?? []);
    } catch (err) {
      console.error("Failed to list admins:", err);
      setError("Failed to load admins.");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      await createAdmin({
        username: createForm.username.trim(),
        password: createForm.password,
        name: createForm.name.trim() || undefined,
        adminRole: createForm.adminRole,
      });
      setCreateOpen(false);
      setCreateForm({
        username: "",
        password: "",
        name: "",
        adminRole: "operations",
      });
      setSuccess("Admin created.");
      fetchAdmins();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setCreateError(ex?.response?.data?.message || "Failed to create admin");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      await updateAdmin(editAdmin.id, {
        name: editName.trim() || null,
        adminRole: editRole,
      });
      setEditAdmin(null);
      setSuccess("Admin updated.");
      fetchAdmins();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setEditError(ex?.response?.data?.message || "Failed to update admin");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordAdmin) return;
    setPasswordError(null);
    setPasswordSubmitting(true);
    try {
      await updateAdminPassword(passwordAdmin.id, newPassword);
      setPasswordAdmin(null);
      setNewPassword("");
      setSuccess("Password updated.");
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        ex?.response?.data?.message || "Failed to update password"
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Admins | Delivery App Admin"
        description="Manage panel admin accounts and roles"
      />
      <PageBreadcrumb pageTitle="Admins" />
      <div className="space-y-6">
        <ComponentCard
          title="Panel admins"
          desc="Create admins and assign roles: Super admin (full access), Operations (users, drivers, trips), Finance (payments and wallets)."
        >
          {success && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 dark:bg-green-500/10 p-3 rounded">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setSuccess(null);
                setCreateOpen(true);
              }}
            >
              Create admin
            </Button>
          </div>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading admins...</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Username
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Name
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Role
                      </TableCell>
                      <TableCell isHeader className="p-4 dark:text-white">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="px-4 py-3 text-gray-800 dark:text-white">
                          {admin.username}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {admin.name || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {roleLabel(admin.adminRole)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSuccess(null);
                                setEditAdmin(admin);
                                setEditName(admin.name || "");
                                setEditRole(admin.adminRole);
                                setEditError(null);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSuccess(null);
                                setPasswordAdmin(admin);
                                setNewPassword("");
                                setPasswordError(null);
                              }}
                            >
                              Reset password
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {admins.length === 0 && (
                <div className="py-8 text-center text-gray-500">No admins found</div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
      >
        <div className="max-w-md p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Create admin
          </h3>
          {createError && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Username</Label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, username: e.target.value }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
                disabled={createSubmitting}
              />
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
                minLength={6}
                disabled={createSubmitting}
              />
            </div>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                disabled={createSubmitting}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={createForm.adminRole}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    adminRole: e.target.value as AdminRole,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                disabled={createSubmitting}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!editAdmin}
        onClose={() => {
          setEditAdmin(null);
          setEditError(null);
        }}
      >
        <div className="max-w-md p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Edit admin
          </h3>
          {editError && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {editError}
            </div>
          )}
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                disabled={editSubmitting}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AdminRole)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                disabled={editSubmitting}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAdmin(null)}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!passwordAdmin}
        onClose={() => {
          setPasswordAdmin(null);
          setPasswordError(null);
        }}
      >
        <div className="max-w-md p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Reset password
            {passwordAdmin ? ` — ${passwordAdmin.username}` : ""}
          </h3>
          {passwordError && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {passwordError}
            </div>
          )}
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <Label>New password</Label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
                minLength={6}
                disabled={passwordSubmitting}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordAdmin(null)}
                disabled={passwordSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? "Saving…" : "Update password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
