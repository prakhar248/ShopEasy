// ============================================================
//  context/AuthContext.jsx  —  UPDATED: stores sellerProfile too
// ============================================================
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const storedUser    = localStorage.getItem("user");
    const storedSeller  = localStorage.getItem("sellerProfile");
    const storedToken   = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      if (storedSeller) setSellerProfile(JSON.parse(storedSeller));
    }
    setLoading(false);
  }, []);

  const login = (userData, token, sellerData = null) => {
    if (!userData || !token) {
      console.error("AuthContext.login: missing user or token", { userData, token });
      return;
    }
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    if (sellerData) {
      localStorage.setItem("sellerProfile", JSON.stringify(sellerData));
    } else {
      localStorage.removeItem("sellerProfile");
    }
    setUser(userData);
    setSellerProfile(sellerData || null);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("sellerProfile");
    setUser(null);
    setSellerProfile(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Helper booleans for role checks — used throughout the UI
  const isCustomer = user?.role === "customer";
  const isSeller   = user?.role === "seller";
  const isAdmin    = user?.role === "admin";
  const isApprovedSeller = isSeller && sellerProfile?.isApproved;

  return (
    <AuthContext.Provider value={{
      user, sellerProfile, loading,
      login, logout, updateUser,
      isCustomer, isSeller, isAdmin, isApprovedSeller,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
