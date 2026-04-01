// ============================================================
//  src/pages/Cart.jsx
//  Shows cart items with quantity controls and order summary
// ============================================================

import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const items       = cart?.items || [];
  const totalPrice  = items.reduce((acc, i) => acc + i.priceAtAdd * i.quantity, 0);
  const shipping    = totalPrice > 500 ? 0 : 50;
  const tax         = Math.round(totalPrice * 0.18);
  const grandTotal  = totalPrice + shipping + tax;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand" />
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl mb-4">🛒</p>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">Add some products to get started</p>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">

        {/* ── Cart Items ─────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item._id} className="card flex gap-4">
              {/* Product image */}
              <Link to={`/products/${item.product._id}`}>
                {(() => {
                  // Handle images that can be either strings or {url, publicId} objects
                  const imageUrl = typeof item.product.images?.[0] === "string"
                    ? item.product.images[0]
                    : item.product.images?.[0]?.url || "https://via.placeholder.com/100";
                  return (
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                  );
                })()}
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product._id}`}
                  className="font-semibold text-gray-800 hover:text-brand line-clamp-2 text-sm">
                  {item.product.name}
                </Link>
                <p className="text-brand font-bold text-lg mt-1">₹{item.priceAtAdd.toLocaleString()}</p>

                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden text-sm">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 hover:bg-gray-100 disabled:opacity-40 font-bold"
                    >−</button>
                    <span className="px-3 py-1 border-x border-gray-300 font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="px-3 py-1 hover:bg-gray-100 disabled:opacity-40 font-bold"
                    >+</button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-800">
                  ₹{(item.priceAtAdd * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600">
            🗑️ Clear Cart
          </button>
        </div>

        {/* ── Order Summary ──────────────────────────────── */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-green-600 font-medium" : "font-medium"}>
                {shipping === 0 ? "FREE" : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span className="font-medium">₹{tax.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-gray-800 text-lg mb-6">
            <span>Total</span>
            <span className="text-brand">₹{grandTotal.toLocaleString()}</span>
          </div>

          {totalPrice > 0 && totalPrice <= 500 && (
            <p className="text-xs text-center text-gray-400 mb-3">
              Add ₹{(500 - totalPrice).toFixed(0)} more for free shipping!
            </p>
          )}

          <button
            onClick={() => navigate("/checkout")}
            className="btn-primary w-full py-3 text-base"
          >
            Proceed to Checkout →
          </button>

          <Link to="/products" className="btn-secondary w-full py-2.5 text-sm text-center block mt-3">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
