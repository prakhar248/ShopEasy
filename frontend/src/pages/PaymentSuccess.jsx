// ============================================================
//  src/pages/PaymentSuccess.jsx
//  Dedicated success page shown after PayU payment completes.
//  Also syncs cart state (since PayU redirect clears frontend).
// ============================================================

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { syncCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync cart on mount — backend already cleared it, this updates frontend state
  useEffect(() => {
    syncCart();
  }, []);

  // Fetch order details if orderId is present
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const { data } = await api.get(`/orders/${orderId}`);
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Animated Checkmark */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6 animate-bounce">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-500 mb-6">
          Your order has been confirmed and is being processed.
        </p>

        {/* Order Details Card */}
        {!loading && order && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Order ID</span>
                <span className="font-mono text-xs text-gray-700">
                  {order._id}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-green-700">
                  ₹{order.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Method</span>
                <span className="capitalize font-medium">
                  {order.paymentMethod === "payu" ? "🏦 PayU" : "💳 Razorpay"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Items</span>
                <span>{order.items?.length || 0} item(s)</span>
              </div>
            </div>
          </div>
        )}

        {!loading && !order && orderId && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Order ID:</strong>{" "}
              <code className="bg-green-100 px-2 py-0.5 rounded text-xs">
                {orderId}
              </code>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="bg-brand text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-dark transition"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Email Notification */}
        <p className="text-xs text-gray-400 mt-8">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
