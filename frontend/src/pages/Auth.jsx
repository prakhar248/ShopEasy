// ============================================================
//  pages/Auth.jsx  —  UPDATED: role selection dropdown
//  Roles: Customer | Seller (requires store name)
//  Admin accounts cannot be created via public signup.
// ============================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Auth = ({ mode = "login" }) => {
  const [tab,     setTab]     = useState(mode);
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const [form, setForm] = useState({
    name:             "",
    email:            "",
    password:         "",
    confirmPassword:  "",
    role:             "customer",   // default role
    storeName:        "",
    storeDescription: "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── Login ─────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email:    form.email,
        password: form.password,
      });

      // Pass sellerProfile to context so ProtectedRoute can check approval
      login(data.user, data.token, data.sellerProfile);

      toast.success(`Welcome back, ${data.user.name}! 👋`);

      // Role-based redirect
      if (data.user.role === "admin")  return navigate("/admin");
      if (data.user.role === "seller") return navigate("/seller");
      return navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Signup ────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (form.role === "seller" && !form.storeName.trim()) {
      return toast.error("Please enter your store name");
    }

    setLoading(true);
    try {
      const payload = {
        name:             form.name,
        email:            form.email,
        password:         form.password,
        role:             form.role,
        storeName:        form.storeName,
        storeDescription: form.storeDescription,
      };

      const { data } = await api.post("/auth/signup", payload);
      toast.success(data.message);
      setTab("login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="text-3xl font-bold text-brand">🛍️ ShopNow</Link>
            <p className="text-gray-400 text-sm mt-2">
              {tab === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                  ${tab === t ? "bg-white shadow text-brand" : "text-gray-500"}`}>
                {t === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ──────────────────────────────── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Password</label>
                <input type="password" value={form.password} onChange={set("password")}
                  placeholder="••••••••" className="input-field" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          )}

          {/* ── SIGNUP FORM ─────────────────────────────── */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={set("name")}
                  placeholder="John Doe" className="input-field" required />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" className="input-field" required />
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">
                  I want to join as a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "customer", label: "Customer", icon: "🛍️", desc: "Browse & buy products" },
                    { value: "seller",   label: "Seller",   icon: "🏪", desc: "List & sell products" },
                  ].map(({ value, label, icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${form.role === value
                          ? "border-brand bg-brand-light"
                          : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <span className="text-2xl block mb-1">{icon}</span>
                      <span className={`font-semibold text-sm block
                        ${form.role === value ? "text-brand" : "text-gray-700"}`}>
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Store info — shown only when role is seller */}
              {form.role === "seller" && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    Store Details
                  </p>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Store Name <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={form.storeName} onChange={set("storeName")}
                      placeholder="e.g. TechZone Electronics" className="input-field" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Store Description
                    </label>
                    <textarea value={form.storeDescription} onChange={set("storeDescription")}
                      placeholder="Tell customers what you sell..." rows={2}
                      className="input-field resize-none" />
                  </div>
                  <p className="text-xs text-purple-600">
                    ⚠️ Your account will be reviewed by our admin team before you can list products.
                  </p>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Password</label>
                <input type="password" value={form.password} onChange={set("password")}
                  placeholder="Min 6 characters" className="input-field" required minLength={6} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                  placeholder="••••••••" className="input-field" required />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
