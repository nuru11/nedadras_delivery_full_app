import api from "../lib/api";

export interface DeliveryUser {
  id: string;
  name: string;
  phone: string;
}

export interface DeliveryDriver {
  id: string;
  name?: string;
  phone?: string;
}

export interface Delivery {
  id: string;
  order_number?: number | null;
  user_id?: string | null;
  driver_id?: string | null;
  object_type: string;
  weight_kg: number;
  description?: string | null;
  pickup_address: string;
  pickup_name?: string | null;
  drop_address: string;
  drop_name?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  distance_km: number;
  price: number;
  status: string;
  payment?: string;
  paid_from_wallet?: boolean;
   admin_remark?: string | null;
  created_at: string;
  user?: DeliveryUser | null;
  driver?: DeliveryDriver | null;
}

export interface CreateDeliveryPayload {
  pickup: { lat: number; lng: number; address: string; name?: string };
  dropoff: { lat: number; lng: number; address: string; name?: string };
  delivery_plan: string;
  price: number;
  object_type?: string;
  vehicle_type?: string;
  user_id?: string;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  description?: string | null;
}

/** Price formula: weight !== 1 ? 350 + 110 * weight - 110 : 350 */
export function outsideTownPriceForWeight(weightKg: number): number {
  return weightKg !== 1 ? 350 + 110 * weightKg - 110 : 350;
}

export interface CreateOutsideTownPayload {
  pickup_address: string;
  dropoff_address: string;
  weight_kg: number;
  price: number;
  object_type?: string;
  user_id?: string;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  description?: string | null;
}

export interface EstimatePlan {
  price: number;
  eta: string;
}

export interface EstimateResponse {
  distanceKm: number;
  plans: {
    express: EstimatePlan;
    standard: EstimatePlan;
    same_day: EstimatePlan;
  };
}

export const getDeliveries = async (
  status?: string,
  ongoing?: boolean,
  history?: boolean
): Promise<{ deliveries: Delivery[] }> => {
  const params: Record<string, string> = {};
  if (ongoing) params.ongoing = "true";
  else if (history) params.history = "true";
  else if (status) params.status = status;
  const { data } = await api.get<{ deliveries: Delivery[] }>(
    "/admin/deliveries",
    { params: Object.keys(params).length ? params : {} }
  );
  return data;
};

export const getOngoingDeliveries = async (): Promise<{
  deliveries: Delivery[];
}> => getDeliveries(undefined, true, false);

export const getHistoryDeliveries = async (): Promise<{
  deliveries: Delivery[];
}> => getDeliveries(undefined, false, true);

export const createDelivery = async (
  payload: CreateDeliveryPayload
): Promise<{ delivery: Delivery; deliveryRequestCount: number }> => {
  const { data } = await api.post<{
    delivery: Delivery;
    deliveryRequestCount: number;
  }>("/admin/deliveries", payload);
  return data;
};

export const createOutsideTownDelivery = async (
  payload: CreateOutsideTownPayload
): Promise<{ delivery: Delivery; deliveryRequestCount: number }> => {
  const { data } = await api.post<{
    delivery: Delivery;
    deliveryRequestCount: number;
  }>("/admin/deliveries/outside-town", payload);
  return data;
};

export const assignDelivery = async (
  deliveryId: string,
  driverId: string
): Promise<{ delivery: Delivery }> => {
  const { data } = await api.post<{ delivery: Delivery }>(
    `/admin/deliveries/${deliveryId}/assign`,
    { driverId }
  );
  return data;
};

export const updateDeliveryStatus = async (
  deliveryId: string,
  status: string
): Promise<{ delivery: Delivery }> => {
  const { data } = await api.patch<{ delivery: Delivery }>(
    `/admin/deliveries/${deliveryId}/status`,
    { status }
  );
  return data;
};

export const updateDeliveryPayment = async (
  deliveryId: string,
  payment: "paid" | "unpaid"
): Promise<{ delivery: Delivery }> => {
  const { data } = await api.patch<{ delivery: Delivery }>(
    `/admin/deliveries/${deliveryId}/payment`,
    { payment }
  );
  return data;
};

export const updateDeliveryRemark = async (
  deliveryId: string,
  remark: string
): Promise<{ delivery: Delivery }> => {
  const { data } = await api.patch<{ delivery: Delivery }>(
    `/admin/deliveries/${deliveryId}/remark`,
    { remark }
  );
  return data;
};

export const estimateDelivery = async (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<EstimateResponse> => {
  const { data } = await api.post<EstimateResponse>("/deliveries/estimate", {
    pickup,
    dropoff,
  });
  return data;
};
