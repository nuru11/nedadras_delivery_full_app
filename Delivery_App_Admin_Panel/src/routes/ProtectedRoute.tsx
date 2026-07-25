// import { Navigate, Outlet } from "react-router-dom";
// import { isAuthenticated } from "../utils/auth";

// export default function ProtectedRoute() {
//   if (!isAuthenticated()) {
//     return <Navigate to="/signin" replace />;
//   }

//   return <Outlet />;
// }


import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export default function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/signin" replace />;
}
