import api from "../lib/api";

export interface CommissionRates {
  in_house: number;
  freelancer: number;
}

export const getCommissionRates = async (): Promise<CommissionRates> => {
  const { data } = await api.get<CommissionRates>("/admin/commission-rates");
  return data;
};

export const updateCommissionRates = async (
  payload: Partial<CommissionRates>
): Promise<CommissionRates> => {
  const { data } = await api.patch<CommissionRates>(
    "/admin/commission-rates",
    payload
  );
  return data;
};
