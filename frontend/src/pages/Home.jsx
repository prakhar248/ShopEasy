// ============================================================
//  src/pages/Home.jsx
//  Landing page: hero banner, category pills, featured products
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["Electronics", "Clothing", "Books", "Home", "Sports", "Beauty"];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Fetch 8 newest products for the featured section
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/products?limit=8&sort=-createdAt");
        setFeatured(data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="bg-gradient-to-r from-brand to-brand-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Everything you need,<br/>delivered fast.</h1>
          <p className="text-brand-light text-lg mb-8">
            Shop thousands of products with secure payments and easy returns.
          </p>
          <Link to="/products" className="bg-white text-brand font-bold px-8 py-3 rounded-xl
                                          hover:bg-gray-50 transition-colors text-lg">
            Shop Now →
          </Link>
        </div>
      </section>

      {/* ── Category Pills ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">Shop by Category</h2>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              className="bg-brand-light text-brand font-medium px-5 py-2.5 rounded-full
                         hover:bg-brand hover:text-white transition-colors text-sm"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products Grid ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
          <Link to="/products" className="text-brand text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          // Skeleton loading grid
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Trust Badges ───────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {[
            { icon: "🚚", title: "Free Delivery",     sub: "On orders above ₹500" },
            { icon: "🔒", title: "Secure Payments",   sub: "Razorpay protected"    },
            { icon: "↩️", title: "Easy Returns",      sub: "7-day return policy"   },
            { icon: "🎧", title: "24/7 Support",      sub: "We're always here"     },
          ].map(({ icon, title, sub }) => (
            <div key={title}>
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-gray-400 text-xs">{sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
