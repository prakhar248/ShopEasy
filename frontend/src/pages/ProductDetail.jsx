// ============================================================
//  src/pages/ProductDetail.jsx
//  Shows full product details, image gallery, reviews, add-to-cart
// ============================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const [product,   setProduct]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty,       setQty]       = useState(1);
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
      } catch {
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = () => {
    if (!user) return navigate("/login");
    addToCart(product._id, qty);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      toast.success("Review submitted!");
      setComment("");
      // Refresh product to show new review
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand" />
    </div>
  );

  if (!product) return null;

  const displayPrice = product.discountedPrice || product.price;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">

        {/* ── Image Gallery ───────────────────────────────── */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
            <img
              src={
                typeof product.images[activeImg] === "string"
                  ? product.images[activeImg]
                  : product.images[activeImg]?.url
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnail row */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                    ${activeImg === i ? "border-brand" : "border-transparent"}`}
                >
                  <img
                    src={typeof img === "string" ? img : img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ─────────────────────────────────── */}
        <div>
          <p className="text-sm text-brand font-medium mb-2">{product.category}</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400">{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</span>
            <span className="text-gray-500 text-sm">({product.numReviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-gray-800">₹{displayPrice.toLocaleString()}</span>
            {product.discountedPrice && (
              <>
                <span className="text-gray-400 line-through text-lg">₹{product.price.toLocaleString()}</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">
                  {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Stock status */}
          <p className={`text-sm font-medium mb-4 ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.stock > 0 ? `✓ In Stock (${product.stock} left)` : "✗ Out of Stock"}
          </p>

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-gray-600">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-gray-100 text-lg font-bold">−</button>
                <span className="px-4 py-2 font-semibold border-x border-gray-300">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 hover:bg-gray-100 text-lg font-bold">+</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary flex-1 py-3 text-base disabled:opacity-40"
            >
              🛒 Add to Cart
            </button>
            <button
              onClick={async () => { await handleAddToCart(); navigate("/cart"); }}
              disabled={product.stock === 0}
              className="btn-secondary flex-1 py-3 text-base disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {product.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews Section ──────────────────────────────── */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>

        {/* Write a review */}
        {user && (
          <form onSubmit={handleReview} className="card mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">Write a Review</h3>
            <div className="flex gap-2 mb-3">
              {[1,2,3,4,5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="input-field resize-none h-24 mb-3"
              required
            />
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        )}

        {/* Review list */}
        {product.reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{review.name}</span>
                    <span className="text-yellow-400 text-sm">{"★".repeat(review.rating)}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetail;
