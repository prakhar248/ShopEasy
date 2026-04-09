// ============================================================
//  src/components/ProductCard.jsx — Clean product card
// ============================================================
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const hasDiscount    = product.discountedPrice && product.discountedPrice < product.price;
  const displayPrice   = hasDiscount ? product.discountedPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  const imageUrl = typeof product.images?.[0] === "string"
    ? product.images[0]
    : product.images?.[0]?.url || "https://via.placeholder.com/300";

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to add items to cart");
      return;
    }
    addToCart(product._id, 1);
    toast.success("Added to cart");
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden
                    shadow-card hover:shadow-card-hover hover:border-gray-300
                    transform hover:scale-105 interactive"
      >

        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transform transition-smooth group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/20 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[11px]
                             font-bold px-2 py-0.5 rounded-md">
              -{discountPercent}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            {product.category}
          </p>
          <h3 className="font-semibold text-brand text-sm leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">({product.numReviews})</span>
          </div>

          {/* Price + Add */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-gray-900 text-sm">₹{displayPrice?.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">₹{product.price?.toLocaleString()}</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed"
              title="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
