/* Shared types for dashboard (previously from product) */
export type ProductStatus = "active" | "pending" | "inactive" | "rejected";
export type OwnerStatus = "active" | "inactive" | "sold" | "delete";
export type ListingType = "for sale" | "for rent";
export type UserStatus = "active" | "inactive";

export interface ProductPlan {
  id: number;
  name: string;
  price: string;
  priority?: number;
}

export interface ProductSeller {
  id: number;
  name: string;
  phone: string;
  city: string;
  status: UserStatus;
}



export interface AdminDashboardOverviewResponse {
  success: boolean;
  data: AdminDashboardOverview;
}

export interface AdminDashboardOverview {
  totalUsers: number;
  activeCars: number;
  promotedCars: number;
  monthlyRevenue: number;
  sellers: number;       // <-- added
  totalBalance: number;  // <-- added
}


// export interface AdminOverviewDTO {
//   totalUsers: number;
//   activeCars: number;
//   promotedCars: number;
//   monthlyRevenue: number;
// }


export interface AdminMonthlyRevenueResponse {
  success: boolean;
  data: AdminMonthlyRevenue;
}

export interface AdminMonthlyRevenue {
  /** Index 0 = Jan, 11 = Dec */
  monthly: number[];
}




export interface AdminMonthlyActivityResponse {
  success: boolean;
  data: AdminMonthlyActivity;
}

export interface AdminMonthlyActivity {
  /** cars listed per month */
  listings: number[];

  /** future: chats per month */
  chats?: number[];
}


export interface AdminUserDemographicsResponse {
  success: boolean;
  data: AdminUserDemographic[];
}

export interface AdminUserDemographic {
  city: string;
  count: number;
}


export interface AdminRecentPaymentsResponse {
  success: boolean;
  payments: AdminRecentPayment[];
}

/* ---------- PAYMENT ---------- */
export interface AdminRecentPayment {
  id: number;
  amount: string;
  type: "charge" | "refund";
  status: "success" | "failed" | "pending";
  created_at: string;

  user: PaymentUser | null;
  product: PaymentProduct | null;
  plan: PaymentPlan | null;
  description: string | null;
}

/* ---------- USER ---------- */
export interface PaymentUser {
  id: number;
  name: string;
  phone: string;
}

/* ---------- PRODUCT ---------- */
export interface PaymentProduct {
  id: number;
  productName: string;
}

/* ---------- PLAN ---------- */
export interface PaymentPlan {
  id: number;
  name: string;
  price: string;
}



export interface AdminRecentProductsResponse {
  success: boolean;
  products: AdminRecentProduct[];
}

/* ---------- PRODUCT ---------- */
export interface AdminRecentProduct {
  id: number;
  productName: string;
    categoryName: string;
  price: string;
  status: ProductStatus;
  ownerStatus: OwnerStatus;
  listingType: ListingType;
  createdAt: string;

  seller: ProductSeller | null;
  plan: ProductPlan | null;
}


// reused from your product models
// export type ProductStatus = "active" | "pending" | "inactive" | "rejected";
// export type OwnerStatus = "active" | "inactive" | "sold" | "delete";
// export type ListingType = "for sale" | "for rent";
