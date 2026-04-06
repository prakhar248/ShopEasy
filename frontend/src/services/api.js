// ============================================================
//  services/api.js — Axios instance for product & API calls
//  Base URL + Bearer token from localStorage
// ============================================================

import axios from "axios";

const api = axios.create({
  // In development: relative URL goes through Vite proxy (see vite.config.js)
  // In production: VITE_API_URL should be set to the deployed backend URL
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function isAuthPublicRoute(config) {
  const url = String(config?.url || "").toLowerCase();
  return (
    url.includes("auth/login") ||
    url.includes("auth/signup") ||
    url.includes("auth/forgot-password") ||
    url.includes("auth/reset-password")
  );
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !isAuthPublicRoute(error.config)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sellerProfile");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
