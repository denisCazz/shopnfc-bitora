"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Users,
  Briefcase,
  ShoppingCart,
  Cpu,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Settings,
  LifeBuoy,
  Truck,
  LayoutList,
  Megaphone,
  TicketPercent,
  FileText,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import type { AuthUser } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/preventivi", label: "Preventivi PDF", icon: FileText },
  { href: "/admin/orders", label: "Ordini", icon: ShoppingCart },
  { href: "/admin/tracking", label: "Tracking & Clienti Diretti", icon: Truck },
  { href: "/admin/products", label: "Prodotti", icon: Package },
  { href: "/admin/categories", label: "Categorie", icon: LayoutList },
  { href: "/admin/chip", label: "Chip", icon: Cpu },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/dealers", label: "Clienti B2B", icon: Briefcase },
  { href: "/admin/avvisi", label: "Avvisi", icon: Megaphone },
  { href: "/admin/sconti", label: "Codici sconto", icon: TicketPercent },
  { href: "/admin/settings", label: "Impostazioni", icon: Settings },
  { href: "/admin/spedizioni", label: "Spedizioni", icon: Truck },
  { href: "/admin/support", label: "Supporto", icon: LifeBuoy },
];

export default function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Buongiorno";
    if (h >= 12 && h < 18) return "Buon pomeriggio";
    return "Buona sera";
  })();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface border-r border-border z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image src="/bitora.png" alt="Bitora" width={32} height={32} className="w-8 h-8 rounded-full" />
              <span className="text-base font-bold tracking-tight">
                Shop NFC <span className="text-accent">Bitora</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-sky-50 dark:bg-sky-950/40 text-accent"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`w-4.5 h-4.5 ${active ? "text-accent" : "text-muted"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info + back to shop */}
          <div className="p-4 border-t border-border">
            {/* User card */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center ring-2 ring-sky-300/40 dark:ring-sky-500/30 shrink-0">
                <span className="text-[13px] font-bold text-white leading-none">
                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]}
                </div>
                <div className="text-[11px] text-muted truncate">{user.email}</div>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-950/50 text-accent transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-accent" />
                <span className="text-accent">Torna al sito</span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Esci dall&apos;account
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-surface border-b border-border flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <div className="text-sm text-muted">
              <span>{greeting}, </span>
              <span className="font-semibold text-foreground">
                {user.firstName || user.email.split("@")[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
