// ============================================================
//  App.jsx  —  UPDATED with OTP verification routes
// ============================================================
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import AddressPage from "./pages/AddressPage";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateProductPage from "./pages/CreateProductPage";
import SellerStore from "./pages/SellerStore";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Navbar />

          <Routes>

            {/* ───────── PUBLIC ───────── */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/seller/:sellerId" element={<SellerStore />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />

            {/* ───────── OTP & PASSWORD RESET ───────── */}
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ───────── CUSTOMER ───────── */}
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/addresses" element={<ProtectedRoute><AddressPage /></ProtectedRoute>} />

            {/* ───────── SELLER ───────── */}
            <Route
              path="/create-product"
              element={
                <ProtectedRoute sellerOnly>
                  <CreateProductPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/seller"
              element={
                <ProtectedRoute sellerOnly>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ───────── ADMIN ───────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ───────── 404 ───────── */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                  <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
                  <p className="text-lg font-semibold text-gray-700 mb-1">Page not found</p>
                  <p className="text-gray-400 text-sm mb-6">The page you're looking for doesn't exist.</p>
                  <a href="/" className="btn-primary">Go Home</a>
                </div>
              }
            />

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;