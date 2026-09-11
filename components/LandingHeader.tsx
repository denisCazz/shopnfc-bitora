"use client";

import Header from "@/components/Header";
import type { AuthUser } from "@/lib/auth";

export default function LandingHeader({ user }: { user?: AuthUser | null }) {
  return <Header onToggleSidebar={() => {}} sidebarOpen={false} user={user} />;
}
