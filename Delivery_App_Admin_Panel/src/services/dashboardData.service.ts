import api from "../lib/api";
import {
  AdminDashboardOverview,
  
  AdminUserDemographic,
  AdminMonthlyRevenue,
  AdminMonthlyActivity,
  AdminRecentProduct,
  AdminRecentPayment,
} from "../type/dashboardData";

/* =====================================================
   ADMIN DASHBOARD SERVICES
===================================================== */

/* -------- Overview Cards -------- */


/* -------- Overview -------- */
export const getAdminOverview = async (): Promise<AdminDashboardOverview> => {
  const { data } = await api.get<AdminDashboardOverview>(
    "/admin/dashboard/overview"
  );
  return data; // <-- return direct object
};

/* -------- Monthly Revenue Chart -------- */
// export interface MonthlyRevenueDTO {
//   /** Index 0 = Jan, 11 = Dec */
//   monthly: number[];
// }

/* -------- Monthly Revenue -------- */
export const getMonthlyRevenue = async (): Promise<AdminMonthlyRevenue> => {
  const { data } = await api.get<AdminMonthlyRevenue>(
    "admin/dashboard/monthly-revenue"
  );
  return data; // ✅ raw object
};

/* -------- Monthly Activity Chart -------- */
export const getMonthlyActivity = async (): Promise<AdminMonthlyActivity> => {
  const { data } = await api.get<AdminMonthlyActivity>(
    "/admin/dashboard/monthly-activity"
  );
  return data;
};



/* -------- User Demographics (Cities) -------- */
// export const getUserDemographics = async (): Promise<AdminUserDemographic> => {
//   const { data } = await api.get<AdminUserDemographic>(
//     "/admin/dashboard/demographics"
//   );
//   return data;
// };

export const getUserDemographics = async (): Promise<AdminUserDemographic[]> => {
  const { data } = await api.get<AdminUserDemographic[]>(
    "/admin/dashboard/demographics"
  );
  return data; // ✅ raw array
};

/* -------- Recent Payments -------- */
export const getRecentPayments = async (
  limit: number = 10
): Promise<AdminRecentPayment[]> => {
  const { data } = await api.get<AdminRecentPayment[]>(
    "/admin/dashboard/recent-payments",
    {
      params: { limit },
    }
  );
  return data;
};

/* -------- Recent Products -------- */
export const getRecentProducts = async (
  limit: number = 10
): Promise<AdminRecentProduct[]> => {
  const { data } = await api.get<AdminRecentProduct[]>(
    "/admin/dashboard/recent-products",
    {
      params: { limit },
    }
  );
  return data;
};
