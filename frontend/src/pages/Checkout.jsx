// ============================================================
//  src/pages/Checkout.jsx
//  Step 1: Enter shipping address
//  Step 2: Review order
//  Step 3: Pay via Razorpay (test mode)
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const STEPS = ["Address", "Review", "Payment"];

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null); // Our DB order _id

  const [address, setAddress] = useState({
    name:    user?.name    || "",
    street:  "",
    city:    "",
    state:   "",
    pincode: "",
    phone:   user?.phone   || "",
  });

  const items      = cart?.items || [];
  const subtotal   = items.reduce((acc, i) => acc + i.priceAtAdd * i.quantity, 0);
  const shipping   = subtotal > 500 ? 0 : 50;
  const tax        = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  // ── Step 1 → Step 2: Validate address ─────────────────
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (Object.values(address).some((v) => !v.trim())) {
      return toast.error("Please fill all address fields");
    }
    setStep(1);
  };

  // ── Step 2 → Step 3: Place order in DB ────────────────
  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/orders", { shippingAddress: address });
      setOrderId(data.order._id);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Initialize Razorpay checkout ──────────────
  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Get Razorpay order_id from our backend
      const { data } = await api.post("/payment/create-order", { orderId });

      // 2. Razorpay checkout options
      const options = {
        key:         data.keyId,           // rzp_test_xxxx (from .env)
        amount:      data.amount,          // In paise
        currency:    data.currency,
        name:        "ShopNow",
        description: `Order #${orderId}`,
        order_id:    data.razorpayOrderId,

        // 3. Success handler — runs in the browser after payment
        handler: async (response) => {
          try {
            // 4. Verify payment signature on our backend
            await api.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId,
            });
            clearCart();
            toast.success("Payment successful! 🎉");
            navigate("/orders");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },

        prefill: {
          name:    user.name,
          email:   user.email,
          contact: address.phone,
        },

        theme: { color: "#6C63FF" },
      };

      // 5. Open the Razorpay modal
      // Note: Razorpay JS SDK is loaded via <script> in index.html (see run instructions)
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Progress bar */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${i <= step ? "bg-brand text-white" : "bg-gray-200 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${i <= step ? "text-brand" : "text-gray-400"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-brand" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Shipping Address ───────────────────── */}
      {step === 0 && (
        <form onSubmit={handleAddressSubmit} className="card space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Shipping Address</h2>
          {[
            { label: "Full Name",  field: "name",    type: "text" },
            { label: "Phone",      field: "phone",   type: "tel"  },
            { label: "Street",     field: "street",  type: "text" },
            { label: "City",       field: "city",    type: "text" },
            { label: "State",      field: "state",   type: "text" },
            { label: "PIN Code",   field: "pincode", type: "text" },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
              <input
                type={type}
                value={address[field]}
                onChange={(e) => setAddress((a) => ({ ...a, [field]: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full py-3">Continue to Review →</button>
        </form>
      )}

      {/* ── STEP 1: Review Order ───────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Order Review</h2>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <img src={item.product.images?.[0]?.url} alt={item.product.name}
                  className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{item.product.name}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.priceAtAdd * item.quantity).toLocaleString()}</p>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span><span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
              <div className="flex justify-between text-gray-500">
                <span>GST 18%</span><span>₹{tax}</span></div>
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t">
                <span>Total</span><span className="text-brand">₹{grandTotal.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="card text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">Delivering to:</h3>
            <p>{address.name} · {address.phone}</p>
            <p>{address.street}, {address.city}</p>
            <p>{address.state} – {address.pincode}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1 py-3">← Back</button>
            <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? "Placing..." : "Place Order →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payment ────────────────────────────── */}
      {step === 2 && (
        <div className="card text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Pay</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your order is placed. Complete payment via Razorpay (test mode).
          </p>
          <p className="text-3xl font-bold text-brand mb-6">₹{grandTotal.toLocaleString()}</p>
          <button onClick={handlePayment} disabled={loading} className="btn-primary w-full py-4 text-lg">
            {loading ? "Opening Razorpay..." : "Pay Now with Razorpay"}
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Test card: 4111 1111 1111 1111 · Expiry: any future · CVV: any 3 digits
          </p>
        </div>
      )}
    </div>
  );
};

export default Checkout;
