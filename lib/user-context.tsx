"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface UserContextType {
  dealerDiscount: number | null;
  isDealer: boolean;
  pricesIncludeVat: boolean;
  loading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextType>({
  dealerDiscount: null,
  isDealer: false,
  pricesIncludeVat: true,
  loading: true,
  refresh: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [dealerDiscount, setDealerDiscount] = useState<number | null>(null);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchUser = useCallback(() => {
    setLoading(true);
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setDealerDiscount(data?.dealerDiscount ?? null);
        setPricesIncludeVat(data?.pricesIncludeVat ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Refetch on route change (e.g. after login redirect)
  useEffect(() => {
    fetchUser();
  }, [pathname, fetchUser]);

  return (
    <UserContext.Provider
      value={{
        dealerDiscount,
        isDealer: dealerDiscount !== null,
        pricesIncludeVat,
        loading,
        refresh: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
