// ============================================================
//  src/pages/PaymentSuccess.jsx — Clean success state
// ============================================================
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { CheckCircle, Package, ArrowRight, CreditCard } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { syncCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { syncCart(); }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) { setLoading(false); return; }
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center animate-fade-in">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-accent-light mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your order has been confirmed and is being processed.
        </p>

        {/* Order Details */}
        {!loading && order && (
          <div className="card text-left mb-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Order ID</span>
                <span className="font-mono text-xs text-gray-800">{order._id}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Amount Paid</span>
                <span className="font-semibold text-accent-dark">
                  ₹{order.totalPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Method</span>
                <span className="capitalize font-medium inline-flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {order.paymentMethod === "payu" ? "PayU" : "Razorpay"}
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
          <div className="card mb-6 text-left">
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Order ID:</span>{" "}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{orderId}</code>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/orders" className="btn-primary">
            <Package className="w-4 h-4" /> View My Orders
          </Link>
          <Link to="/products" className="btn-secondary">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
