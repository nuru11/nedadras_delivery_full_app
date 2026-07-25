import api from "../lib/api";

export interface DeliveryDashboardOverview {
  activeTrips: number;
  pendingTrips: number;
  totalUsers: number;
  totalDrivers: number;
  revenueThisMonth: number;
  unpaidOrdersCount: number;
  paidOrdersCount: number;
}

export const getDeliveryOverview = async (): Promise<DeliveryDashboardOverview> => {
  const { data } = await api.get<DeliveryDashboardOverview>(
    "/admin/dashboard/overview"
  );
  return data;
};
