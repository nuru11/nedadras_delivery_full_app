import { useNavigate } from "react-router-dom";

import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { logout } from "../../utils/auth";


export default function UserDropdown() {



  const navigate = useNavigate();

  const handleLogout = () => {
  logout();
  navigate("/signin", { replace: true });
};


  return (
    <div className="relative">
     

      <DropdownItem
  onItemClick={handleLogout}
  tag="button"
  className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
>
  {/* icon */}
  Sign out
</DropdownItem>

      
    </div>
  );
}
