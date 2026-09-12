export interface ChipFilter {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  productCount: number;
}

export type UserRole = "customer" | "dealer" | "admin";
export type DealerStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentMethod =
  | "stripe"
  | "paypal"
  | "bank_transfer"
  | "cod"
  | "satispay";
export type AnnouncementSeverity = "info" | "warning" | "critical";
export type AnnouncementAudience = "users" | "admin" | "both";
export type AnnouncementScheduleMode = "always" | "range";
export type DiscountType = "percent" | "fixed";
