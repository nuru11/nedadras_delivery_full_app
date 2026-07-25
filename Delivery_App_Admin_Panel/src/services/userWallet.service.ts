import api from "../lib/api";

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "adjustment" | "refund" | "debit_delivery";
  delivery_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface UserWalletResponse {
  balance: number;
  transactions: WalletTransaction[];
}

export interface DepositResponse {
  balance: number;
  transaction: WalletTransaction | null;
}

export const getUserWallet = async (userId: string): Promise<UserWalletResponse> => {
  const { data } = await api.get<UserWalletResponse>(`/admin/users/${userId}/wallet`);
  return data;
};

export const depositToUserWallet = async (
  userId: string,
  amount: number,
  notes?: string
): Promise<DepositResponse> => {
  const { data } = await api.post<DepositResponse>(
    `/admin/users/${userId}/wallet/deposit`,
    { amount, notes: notes || undefined }
  );
  return data;
};
