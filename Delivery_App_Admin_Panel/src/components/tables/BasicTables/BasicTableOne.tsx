import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import UserWalletModal from "../../users/UserWalletModal";
import { getAllUsers, AdminUser, updateUserStatus, createUser } from "../../../services/user.service";

type FilterType = "all" | "today" | "week" | "month";

interface UsersTableProps {
  statusFilter?: AdminUser["status"];
}

export default function UsersTable({ statusFilter }: UsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;
  const [filter, setFilter] = useState<FilterType>("all");
  const [walletModalUser, setWalletModalUser] = useState<{ id: string; name: string } | null>(null);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserName, setCreateUserName] = useState("");
  const [createUserPhone, setCreateUserPhone] = useState("");
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  };

  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchUsers = async (pageNumber: number) => {
    setLoading(true);
    try {
      const data = await getAllUsers(pageNumber, limit);
      setUsers(data.users);
      setPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalUsers(data.totalUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const filteredUsers = users.filter((u) => {
    // Filter by status if a statusFilter is provided (pending/active/inactive)
    if (statusFilter && (u.status ?? "pending") !== statusFilter) {
      return false;
    }

    const createdAt = u.created_at || "";
    if (filter === "today") return isToday(createdAt);
    if (filter === "week") return isThisWeek(createdAt);
    if (filter === "month") return isThisMonth(createdAt);
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "driver":
        return "primary";
      default:
        return "success";
    }
  };

  if (loading)
    return <p className="text-gray-600 dark:text-gray-300">Loading users...</p>;

  const handleStatusChange = async (userId: string, status: AdminUser["status"]) => {
    if (!status) return;
    try {
      const updated = await updateUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: updated.status } : u))
      );
    } catch (err) {
      console.error("Failed to update user status:", err);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total: {totalUsers} users
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            To add credit to a user&apos;s wallet, click <strong className="text-gray-700 dark:text-gray-300">Add balance</strong> in their row.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" onClick={() => setCreateUserModalOpen(true)}>
            Create user
          </Button>
          {[
            { key: "all", label: "All" },
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "primary" : "outline"}
              onClick={() => setFilter(f.key as FilterType)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="p-4 dark:text-white">
                No
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Name
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Phone
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Role
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Joined
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Status
              </TableCell>
              <TableCell isHeader className="p-4 dark:text-white">
                Add balance
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredUsers.map((user, index) => {
              const isNewToday = user.created_at && isToday(user.created_at);
              return (
                <TableRow
                  key={user.id}
                  className={isNewToday ? "bg-green-50 dark:bg-green-500/10" : ""}
                >
                  <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {index + 1 + (page - 1) * limit}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                      {isNewToday && (
                        <span className="text-xs text-green-600 font-semibold dark:text-green-400">
                          New Today
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {user.phone}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge size="sm" color={getRoleBadgeColor(user.role || "user")}>
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.created_at
                      ? formatRelativeDate(user.created_at)
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <select
                      value={user.status ?? "pending"}
                      onChange={(e) =>
                        handleStatusChange(user.id, e.target.value as AdminUser["status"])
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        setWalletModalUser({ id: user.id, name: user.name || "User" })
                      }
                    >
                      Add balance
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No users found
        </div>
      )}

      <div className="flex justify-center items-center gap-3 py-4">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </div>

      {walletModalUser && (
        <UserWalletModal
          isOpen={!!walletModalUser}
          onClose={() => setWalletModalUser(null)}
          userId={walletModalUser.id}
          userName={walletModalUser.name}
        />
      )}

      <Modal
        isOpen={createUserModalOpen}
        onClose={() => {
          setCreateUserModalOpen(false);
          setCreateUserName("");
          setCreateUserPhone("");
          setCreateUserError(null);
        }}
      >
        <div className="max-w-md p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Create user
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            
          </p>
          {createUserError && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {createUserError}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateUserError(null);
              const name = createUserName.trim();
              const phone = createUserPhone.trim().replace(/\s+/g, "");
              if (!name) {
                setCreateUserError("Name is required");
                return;
              }
              if (!phone) {
                setCreateUserError("Phone is required");
                return;
              }
              if (!/^09\d{8}$/.test(phone)) {
                setCreateUserError("Phone must start with 09 and be 10 digits");
                return;
              }
              setCreateUserSubmitting(true);
              try {
                await createUser(name, phone);
                setCreateUserModalOpen(false);
                setCreateUserName("");
                setCreateUserPhone("");
                fetchUsers(1);
              } catch (err: unknown) {
                const ex = err as { response?: { data?: { message?: string } } };
                setCreateUserError(
                  ex?.response?.data?.message || "Failed to create user"
                );
              } finally {
                setCreateUserSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Name</Label>
              <input
                type="text"
                value={createUserName}
                onChange={(e) => setCreateUserName(e.target.value)}
                placeholder="User name"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                disabled={createUserSubmitting}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input
                type="tel"
                value={createUserPhone}
                onChange={(e) => setCreateUserPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                disabled={createUserSubmitting}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateUserModalOpen(false)}
                disabled={createUserSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserSubmitting}>
                {createUserSubmitting ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
