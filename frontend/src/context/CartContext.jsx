// ============================================================
//  src/context/CartContext.jsx
//  Provides: cart, cartCount, addToCart(), removeFromCart(),
//            updateQuantity(), clearCart(), syncCart()
// ============================================================

import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart,    setCart]    = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart from server whenever user logs in
  useEffect(() => {
    if (user) {
      syncCart();
    } else {
      // Clear local cart state when logged out
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    }
  }, [user]);

  // Pull fresh cart data from the backend
  const syncCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/cart");
      setCart(data.cart);
    } catch (err) {
      console.error("Failed to sync cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await api.post("/cart/add", { productId, quantity });
      setCart(data.cart);
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await api.put("/cart/update", { productId, quantity });
      setCart(data.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${productId}`);
      setCart(data.cart);
      toast.info("Item removed from cart");
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await api.delete("/cart/clear");
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  // Derived values
  const cartCount = cart.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{ cart, cartCount, loading, addToCart, updateQuantity, removeFromCart, clearCart, syncCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
