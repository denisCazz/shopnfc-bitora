"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  weight?: number | null;
  /** Same product, different options (es. scheda programmata vs vergine) */
  lineKey?: string;
  /** Nota ordine (mostrata in checkout e ordine) */
  lineNotes?: string | null;
}

export function normalizeCartLineKey(lineKey?: string | null): string {
  return lineKey ?? "";
}

export function cartLineId(item: Pick<CartItem, "id" | "lineKey">): string {
  return `${item.id}::${normalizeCartLineKey(item.lineKey)}`;
}

function sameLine(
  a: Pick<CartItem, "id" | "lineKey">,
  b: Pick<CartItem, "id" | "lineKey">
): boolean {
  return a.id === b.id && normalizeCartLineKey(a.lineKey) === normalizeCartLineKey(b.lineKey);
}

interface CartContextType {
  items: CartItem[];
  /** false until localStorage has been read (avoids empty-cart flash) */
  loaded: boolean;
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: number, lineKey?: string) => void;
  updateQuantity: (id: number, quantity: number, lineKey?: string) => void;
  clearCart: () => void;
  /** Replace cart contents (e.g. restore after a cancelled checkout) */
  replaceCart: (next: CartItem[]) => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "shopnfc_cart_v2";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, product));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, product)
            ? { ...i, quantity: i.quantity + quantity, lineNotes: product.lineNotes ?? i.lineNotes }
            : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: number, lineKey?: string) => {
    setItems((prev) =>
      prev.filter((i) => !sameLine(i, { id, lineKey }))
    );
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number, lineKey?: string) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (sameLine(i, { id, lineKey }) ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const replaceCart = useCallback((next: CartItem[]) => {
    setItems(next);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        replaceCart,
        totalItems,
        totalPrice,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
