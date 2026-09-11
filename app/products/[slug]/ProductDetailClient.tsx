"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { AuthUser } from "@/lib/auth";
import type { Category } from "@/data/categories";

export default function ProductDetailClient({
  children,
  user,
  categories,
}: {
  children: React.ReactNode;
  user?: AuthUser | null;
  categories: Category[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleCategorySelect(slug: string | null) {
    if (slug) {
      router.push(`/categories/${slug}`);
    } else {
      router.push("/");
    }
    setSidebarOpen(false);
  }

  return (
    <>
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        user={user}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeCategory={null}
        onSelect={handleCategorySelect}
        categories={categories}
        products={[]}
        mobileOnly
      />
      {children}
    </>
  );
}
