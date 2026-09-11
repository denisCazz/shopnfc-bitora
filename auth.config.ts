import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/lib/types";

export default {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { validateCredentials } = await import(
          "@/lib/auth/validate-credentials"
        );
        try {
          return await validateCredentials(
            String(credentials.email),
            String(credentials.password)
          );
        } catch (err) {
          const name = err instanceof Error ? err.name : "";
          const msg = err instanceof Error ? err.message : "";
          if (name === "EmailNotVerifiedError" || msg === "email_not_verified") {
            throw new Error("email_not_verified");
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          email: string;
          name?: string | null;
          role: UserRole;
          dealerDiscount: number | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.dealerDiscount = u.dealerDiscount;
        token.name = u.name ?? u.email;
        token.email = u.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        const id = typeof token.id === "string" ? token.id : String(token.id);
        session.user.id = id;
        (session.user as { role: UserRole }).role = token.role as UserRole;
        (session.user as { dealerDiscount: number | null }).dealerDiscount =
          (token.dealerDiscount as number | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
