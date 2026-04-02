// ============================================================
//  src/pages/Checkout.jsx  —  ENHANCED Address Management
//  Step 0: Select/Add address (with direct save from checkout)
//  Step 1: Review order
//  Step 2: Pay via Razorpay (test mode)
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import addressService from "../services/addressService";
import AddressForm from "../components/AddressForm";
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
  const [savingAddress, setSavingAddress] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Address management
  const [savedAddresses, setSavedAddresses]   = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    name:    user?.name    || "",
    phone:   user?.phone   || "",
    street:  "",
    city:    "",
    state:   "",
    pincode: "",
  });

  // Calculate prices
  const items      = cart?.items || [];
  const subtotal   = items.reduce((acc, i) => acc + i.priceAtAdd * i.quantity, 0);
  const shipping   = subtotal > 500 ? 0 : 50;
  const tax        = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  // Fetch saved addresses on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setSavedAddresses(data.addresses || []);
      
      // If addresses exist, auto-select default or first
      if (data.addresses.length > 0) {
        const defaultAddr = data.addresses.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr?._id || data.addresses[0]._id);
        setShowAddressForm(false);
      } else {
        // No addresses → show form
        setShowAddressForm(true);
        setSelectedAddressId(null);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setShowAddressForm(true);
      toast.error("Failed to load addresses");
    }
  };

  // Get current address object (selected saved or from form)
  const getCurrentAddress = () => {
    if (selectedAddressId) {
      const addr = savedAddresses.find((a) => a._id === selectedAddressId);
      if (addr) {
        return {
          name:    addr.name,
          street:  addr.street,
          city:    addr.city,
          state:   addr.state,
          pincode: addr.pincode,
          phone:   addr.phone,
        };
      }
    }
    return formData;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save address directly from checkout
  const handleSaveAddressFromCheckout = async (e) => {
    e.preventDefault();

    console.log("💾 Save address handler called");
    console.log("📋 Form data:", formData);

    // Validate
    if (!formData.name || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.pincode) {
      console.log("❌ Validation failed - missing fields");
      return toast.error("Please fill all address fields");
    }

    console.log("✅ Validation passed");
    setSavingAddress(true);

    try {
      console.log("📤 Sending POST request to /api/addresses");
      const response = await addressService.addAddress({
        ...formData,
        label: "home",
        isDefault: savedAddresses.length === 0,
      });

      console.log("✨ Address saved response:", response);

      if (!response.address || !response.address._id) {
        console.error("❌ Response missing address._id:", response);
        throw new Error("Address saved but missing ID in response");
      }

      console.log("📌 Address ID received:", response.address._id);
      toast.success("Address saved successfully!");

      // Refresh addresses
      console.log("🔄 Refreshing address list...");
      await fetchSavedAddresses();

      // Auto-select newly added address
      console.log("✔️ Selecting newly added address:", response.address._id);
      setSelectedAddressId(response.address._id);
      setShowAddressForm(false);

      // Reset form
      setFormData({
        name:    user?.name || "",
        phone:   user?.phone || "",
        street:  "",
        city:    "",
        state:   "",
        pincode: "",
      });

      console.log("🎉 Address save complete!");
    } catch (err) {
      console.error("❌ Error saving address:", err?.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name:    user?.name || "",
      phone:   user?.phone || "",
      street:  "",
      city:    "",
      state:   "",
      pincode: "",
    });
    setShowAddressForm(false);
  };

  // ── Step 0 → Step 1: Validate address selection ─────────────────
  const handleAddressSubmit = (e) => {
    e.preventDefault();

    if (!selectedAddressId) {
      return toast.error("Please select or add an address to continue");
    }

    setStep(1);
  };

  // ── Step 1 → Step 2: Place order in DB ────────────────
  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const shippingAddress = getCurrentAddress();
      
      const { data } = await api.post("/orders", { shippingAddress });
      setOrderId(data.order._id);
      setStep(2);
    } catch (err) {
      console.error("[Checkout] Order creation error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Initialize Razorpay checkout ──────────────
  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payment/create-order", { orderId });

      const shippingAddress = getCurrentAddress();
      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "ShopNow",
        description: `Order #${orderId}`,
        order_id:    data.razorpayOrderId,

        handler: async (response) => {
          try {
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
          contact: shippingAddress.phone,
        },

        theme: { color: "#2563EB" },
      };

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

  const currentAddress = getCurrentAddress();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Progress bar */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${i <= step ? "text-blue-600" : "text-gray-400"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Shipping Address ───────────────────── */}
      {step === 0 && (
        <form onSubmit={handleAddressSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 space-y-6">
          <h2 className="font-bold text-gray-800 text-lg">Shipping Address</h2>

          {/* Case 1: No addresses yet */}
          {savedAddresses.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                📍 <strong>No saved addresses yet.</strong> Please add one to continue with checkout.
              </p>
            </div>
          )}

          {/* Saved Addresses (if any exist) */}
          {savedAddresses.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Your Saved Addresses</h3>
              </div>
              <div className="space-y-2 mb-4">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedAddressId === addr._id && !showAddressForm
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddressId === addr._id && !showAddressForm}
                        onChange={() => {
                          setSelectedAddressId(addr._id);
                          setShowAddressForm(false);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{addr.name}</p>
                          {addr.isDefault && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{addr.street}</p>
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.state} {addr.pincode}
                        </p>
                        <p className="text-sm text-gray-600 font-medium mt-1">📞 {addr.phone}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Toggle add new address */}
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
                >
                  + Add a Different Address
                </button>
              )}
            </div>
          )}

          {/* Address Form - Show when: no addresses OR user clicks "add new" */}
          {showAddressForm && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">
                  {savedAddresses.length === 0 ? "Add Address to Continue" : "Add New Address"}
                </h3>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      resetForm();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              <AddressForm
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSaveAddressFromCheckout}
                onCancel={resetForm}
                loading={savingAddress}
                submitLabel={savingAddress ? "Saving..." : "Save & Use This Address"}
                showCancel={savedAddresses.length > 0}
              />
            </div>
          )}

          {/* Submit Button - Disabled if no address selected */}
          <button
            type="submit"
            disabled={!selectedAddressId}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {selectedAddressId ? "Continue to Review →" : "Please Select or Add an Address"}
          </button>
        </form>
      )}

      {/* ── STEP 1: Review Order ───────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4">Order Review</h2>
            {items.map((item, i) => {
              const imageUrl = typeof item.product.images?.[0] === "string"
                ? item.product.images[0]
                : item.product.images?.[0]?.url;
              return (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <img src={imageUrl} alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{item.product.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">₹{(item.priceAtAdd * item.quantity).toLocaleString()}</p>
                </div>
              );
            })}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span><span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST 18%</span><span>₹{tax}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t">
                <span>Total</span><span className="text-blue-600">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">Delivering to:</h3>
            <p><strong>{currentAddress.name}</strong></p>
            <p>{currentAddress.street}</p>
            <p>{currentAddress.city}, {currentAddress.state} {currentAddress.pincode}</p>
            <p className="font-semibold mt-2">{currentAddress.phone}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">
              ← Back
            </button>
            <button onClick={handlePlaceOrder} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "Placing..." : "Place Order →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payment ────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Pay</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your order is placed. Complete payment via Razorpay (test mode).
          </p>
          <p className="text-3xl font-bold text-blue-600 mb-6">₹{grandTotal.toLocaleString()}</p>
          <button onClick={handlePayment} disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-4 text-lg rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
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
