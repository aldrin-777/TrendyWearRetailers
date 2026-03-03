"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { fetchShoppingCart, ShoppingCartItem } from "../lib/fetchShoppingCart";
import { createClient } from "@/utils/supabase/client";

export type CartItem = {
  id: number, 
  name: string, 
  item_id: number,
  category: string, 
  price: number, 
  quantity: number, 
  size: string, 
  color: string, 
  image: string, 
  isFavorite: boolean,
  isEditing: false 
};

type CartContextType = {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Initialize cart from Supabase on mount and when auth state changes
  useEffect(() => {
    const supabase = createClient();

    // Fetch cart on initial mount
    async function initializeCart() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Only fetch cart if user is logged in
        if (session?.user?.id) {
          const cart = await fetchShoppingCart();
          setCartItems(cart);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error("Error initializing cart:", err);
        setCartItems([]);
      }
    }

    initializeCart();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.id) {
          // User just logged in, fetch their cart
          try {
            const cart = await fetchShoppingCart();
            setCartItems(cart);
          } catch (err) {
            console.error("Error fetching cart after login:", err);
            setCartItems([]);
          }
        } else if (event === "SIGNED_OUT") {
          setCartItems([]);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ cartItems, setCartItems, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};