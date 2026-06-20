"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem, Cart } from "@/types";

interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function computeTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("shoko_cart");
      if (stored) {
        const items: CartItem[] = JSON.parse(stored);
        setCart({ items, total: computeTotal(items) });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("shoko_cart", JSON.stringify(cart.items));
  }, [cart]);

  function addItem(item: Omit<CartItem, "id">) {
    setCart((prev) => {
      const existing = prev.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId && i.gelatoProductId === (item as any).gelatoProductId
      );
      let newItems: CartItem[];
      if (existing) {
        newItems = prev.items.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        const newItem: CartItem = {
          ...item,
          id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
        newItems = [...prev.items, newItem];
      }
      return { items: newItems, total: computeTotal(newItems) };
    });
  }

  function removeItem(id: string) {
    setCart((prev) => {
      const newItems = prev.items.filter((i) => i.id !== id);
      return { items: newItems, total: computeTotal(newItems) };
    });
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) => {
      const newItems =
        quantity <= 0
          ? prev.items.filter((i) => i.id !== id)
          : prev.items.map((i) => (i.id === id ? { ...i, quantity } : i));
      return { items: newItems, total: computeTotal(newItems) };
    });
  }

  function clearCart() {
    setCart({ items: [], total: 0 });
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQuantity, clearCart, itemCount }}
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
