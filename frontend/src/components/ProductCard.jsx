// ============================================================
//  src/components/ProductCard.jsx
//  Reusable card shown in the products grid
// ============================================================

import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const hasDiscount    = product.discountedPrice && product.discountedPrice < product.price;
  const displayPrice   = hasDiscount ? product.discountedPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Don't navigate — we're inside a <Link>
    if (!user) {
      alert("Please log in to add items to cart");
      return;
    }
    addToCart(product._id, 1);
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <div className="card hover:shadow-md transition-shadow duration-200 overflow-hidden p-0">

        {/* Product Image */}
        <div className="relative overflow-hidden aspect-square bg-gray-100">
          <img
            src={product.images[0]?.url || "https://via.placeholder.com/300"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs
                             font-bold px-2 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2">{product.name}</h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-400 text-xs">{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</span>
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-gray-800">₹{displayPrice.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
