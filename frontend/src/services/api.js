// ============================================================
//  services/api.js — Axios instance for product & API calls
//  Base URL + Bearer token from localStorage
// ============================================================

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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
