// ============================================================
//  src/pages/Orders.jsx  —  User's order history
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const STATUS_COLORS = {
  processing: "bg-yellow-100 text-yellow-700",
  shipped:    "bg-blue-100   text-blue-700",
  delivered:  "bg-green-100  text-green-700",
  cancelled:  "bg-red-100    text-red-600",
};

const PAYMENT_COLORS = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-600",
  failed:  "bg-red-100    text-red-600",
};

const Orders = () => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/my-orders");
        setOrders(data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl mb-4">📦</p>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
      <p className="text-gray-400 mb-6">Start shopping and your orders will appear here</p>
      <Link to="/products" className="btn-primary">Shop Now</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

      <div className="space-y-5">
        {orders.map((order) => (
          <div key={order._id} className="card">
            {/* Order header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">Order ID</p>
                <p className="font-mono text-sm text-gray-700">{order._id}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${PAYMENT_COLORS[order.paymentStatus]}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Order items */}
            <div className="space-y-3 mb-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={item.image || "https://via.placeholder.com/60"}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-gray-700 text-sm flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Order footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-4">
                <p className="font-bold text-gray-800">
                  Total: <span className="text-brand">₹{order.totalPrice.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
