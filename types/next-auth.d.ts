import type { UserRole } from "@/lib/types";
import "next-auth";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    dealerDiscount?: number | null;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      dealerDiscount: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    dealerDiscount?: number | null;
  }
}
