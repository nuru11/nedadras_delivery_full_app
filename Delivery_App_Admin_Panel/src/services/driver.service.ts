import api from "../lib/api";

export interface Driver {
  id: string;
  user_id: string;
  name?: string;
  phone?: string;
  vehicle_type: string;
  plate_number: string;
  status?: "pending" | "active" | "inactive";
  driver_type?: "in_house" | "freelancer";
}

export const getDrivers = async (): Promise<{ drivers: Driver[] }> => {
  const { data } = await api.get<{ drivers: Driver[] }>("/admin/drivers");
  return data;
};

export const updateDriverStatus = async (
  id: string,
  status: Driver["status"]
): Promise<Driver> => {
  const { data } = await api.patch<Driver>(`/admin/drivers/${id}/status`, {
    status,
  });
  return data;
};

export const updateDriverType = async (
  id: string,
  driver_type: Driver["driver_type"]
): Promise<Driver> => {
  const { data } = await api.patch<Driver>(`/admin/drivers/${id}/type`, {
    driver_type,
  });
  return data;
};
