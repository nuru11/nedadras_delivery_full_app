import { useNavigate } from "react-router-dom";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { roleLabel } from "../../utils/adminPermissions";

export default function UserDropdown() {
  const navigate = useNavigate();
  const { user, adminRole, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  const displayName = user?.name?.trim() || user?.username || "Admin";

  return (
    <div className="relative flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end text-right leading-tight">
        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
          {displayName}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {roleLabel(adminRole)}
          {user?.username ? ` · @${user.username}` : ""}
        </span>
      </div>
      <DropdownItem
        onItemClick={handleLogout}
        tag="button"
        className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        Sign out
      </DropdownItem>
    </div>
  );
}
