// ============================================================
//  src/pages/Cart.jsx — Shopping cart with summary
// ============================================================
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../api/axios";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Bookmark,
  ArrowRight,
  Package,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const items       = cart?.items || [];
  const totalPrice  = items.reduce((acc, i) => acc + i.priceAtAdd * i.quantity, 0);
  const shipping    = totalPrice > 500 ? 0 : 50;
  const tax         = Math.round(totalPrice * 0.18);
  const grandTotal  = totalPrice + shipping + tax;
  const freeShipProgress = Math.min((totalPrice / 500) * 100, 100);

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        setLoadingSaved(true);
        const { data } = await api.get("/cart/saved-for-later");
        setSavedItems(data.savedForLater || []);
      } catch (err) {
        console.error("Failed to fetch saved items:", err);
      } finally {
        setLoadingSaved(false);
      }
    };
    if (user) fetchSavedItems();
  }, [user]);

  const handleSaveForLater = async (productId) => {
    try {
      await api.post(`/cart/save-for-later/${productId}`);
      toast.success("Item saved for later");
      const { data } = await api.get("/cart/saved-for-later");
      setSavedItems(data.savedForLater || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save item");
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      await api.post(`/cart/move-to-cart/${productId}`);
      toast.success("Item moved to cart");
      const response = await api.get("/cart/saved-for-later");
      setSavedItems(response.data.savedForLater || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to move item");
    }
  };

  const handleRemoveSavedItem = async (productId) => {
    try {
      await api.delete(`/cart/remove-saved/${productId}`);
      toast.info("Item removed");
      setSavedItems(savedItems.filter(item => item.product._id !== productId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  };

  const getImageUrl = (product) => {
    return typeof product.images?.[0] === "string"
      ? product.images[0]
      : product.images?.[0]?.url || "https://via.placeholder.com/100";
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-brand" />
    </div>
  );

  if (items.length === 0 && savedItems.length === 0) return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-2xl bg-gray-100 mx-auto mb-6 flex items-center justify-center shadow-card">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add products to your cart to see them here.</p>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </motion.div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">{items.length} item{items.length > 1 ? "s" : ""}</p>
                <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium inline-flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>

              {items.map((item, i) => (
                <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="card flex gap-4 items-center group hover:shadow-card-hover hover:-translate-y-0.5 transform interactive">
                  <Link to={`/products/${item.product._id}`} className="shrink-0">
                    <img
                      src={getImageUrl(item.product)}
                      alt={item.product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product._id}`}
                        className="font-medium text-brand hover:text-accent text-sm line-clamp-2 transition-colors">
                      {item.product.name}
                    </Link>
                      <p className="text-accent font-bold mt-1">₹{item.priceAtAdd.toLocaleString()}</p>

                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {/* Quantity */}
                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-2 hover:bg-accent/10 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-sm font-semibold text-gray-800 min-w-[36px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-3 py-2 hover:bg-accent/10 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button onClick={() => handleSaveForLater(item.product._id)}
                              className="btn-ghost py-1 px-2 text-xs text-gray-500">
                        <Bookmark className="w-3.5 h-3.5" /> Save
                      </button>
                      <button onClick={() => removeFromCart(item.product._id)}
                              className="btn-ghost py-1 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>

                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="font-bold text-gray-900 text-sm">
                        ₹{(item.priceAtAdd * item.quantity).toLocaleString()}
                      </p>
                    </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Saved for Later */}
          {savedItems.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <Bookmark className="w-4 h-4 text-gray-400" />
                Saved for Later ({savedItems.length})
              </h2>
              <div className="space-y-3">
                {savedItems.map((saved) => (
                  <div key={saved.product._id} className="card flex gap-4">
                    <Link to={`/products/${saved.product._id}`}>
                      <img src={getImageUrl(saved.product)} alt={saved.product.name}
                           className="w-16 h-16 object-cover rounded-lg" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${saved.product._id}`}
                            className="font-medium text-gray-900 hover:text-brand text-sm line-clamp-1 transition-colors">
                        {saved.product.name}
                      </Link>
                      <p className="text-brand font-bold text-sm mt-0.5">
                        ₹{(saved.product.discountedPrice || saved.product.price).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => handleMoveToCart(saved.product._id)} className="btn-primary text-xs py-1.5 px-3">
                          Move to Cart
                        </button>
                        <button onClick={() => handleRemoveSavedItem(saved.product._id)}
                                className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
          <div className="lg:col-span-1">
            <div className="card sticky top-24 space-y-4 shadow-card">
              <h2 className="font-semibold text-gray-900">Order Summary</h2>

              {/* Free shipping progress */}
              {totalPrice < 500 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-amber-700 mb-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Add ₹{(500 - totalPrice).toFixed(0)} more for free shipping</span>
                  </div>
                  <div className="w-full h-1.5 bg-amber-200 rounded-full">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300"
                         style={{ width: `${freeShipProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2.5 text-sm border-b border-gray-100 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-accent font-medium" : "font-medium text-gray-800"}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium text-gray-800">₹{tax.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-gray-900 text-lg pt-1">
                <span>Total</span>
                <span className="text-accent text-2xl">₹{grandTotal.toLocaleString()}</span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="btn-primary w-full py-3 text-sm"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <Link to="/products" className="btn-secondary w-full py-2.5 text-sm text-center block">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
