import api from "../lib/api";

export interface Settlement {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  amount: number;
  received_at: string;
  notes?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface PaidDeliveryRow {
  id: string;
  price: number;
  driver_commission_amount: number | null;
  amount_due_to_admin: number | null;
  payment: string;
  created_at: string;
}

export interface DriverPaymentSummary {
  driver: { id: string; name?: string; phone?: string };
  totalDueFromDeliveries: number;
  totalSettled: number;
  balance: number;
  totalCommissionFromWalletPaid?: number;
  paidDeliveries: PaidDeliveryRow[];
  settlements: { id: string; amount: number; received_at: string; notes?: string | null }[];
}

export interface CreateSettlementBody {
  driver_id: string;
  amount: number;
  received_at?: string;
  notes?: string;
}

export const createSettlement = async (
  body: CreateSettlementBody
): Promise<Settlement> => {
  const { data } = await api.post<Settlement>("/admin/settlements", body);
  return data;
};

export const getSettlements = async (driverId?: string): Promise<{ settlements: Settlement[] }> => {
  const params = driverId ? { driver_id: driverId } : {};
  const { data } = await api.get<{ settlements: Settlement[] }>("/admin/settlements", { params });
  return data;
};

export const getDriverPaymentSummary = async (
  driverId: string
): Promise<DriverPaymentSummary> => {
  const { data } = await api.get<DriverPaymentSummary>(
    `/admin/drivers/${driverId}/payment-summary`
  );
  return data;
};

export const getAllDriversPaymentSummary = async (): Promise<{
  drivers: DriverPaymentSummary[];
}> => {
  const { data } = await api.get<{ drivers: DriverPaymentSummary[] }>(
    "/admin/payment-summary"
  );
  return data;
};
