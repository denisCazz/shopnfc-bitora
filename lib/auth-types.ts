import type { UserRole } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  dealerDiscount: number | null;
}
