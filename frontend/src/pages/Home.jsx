// ============================================================
//  src/pages/Home.jsx — Landing page: hero, categories, featured
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Monitor,
  Shirt,
  BookOpen,
  Home as HomeIcon,
  Dumbbell,
  Sparkles,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";

const CATEGORIES = [
  { name: "Electronics", icon: Monitor },
  { name: "Clothing",    icon: Shirt },
  { name: "Books",       icon: BookOpen },
  { name: "Home",        icon: HomeIcon },
  { name: "Sports",      icon: Dumbbell },
  { name: "Beauty",      icon: Sparkles },
];

const TRUST = [
  { icon: Truck,        title: "Free Delivery",   sub: "On orders above ₹500" },
  { icon: ShieldCheck,  title: "Secure Payments",  sub: "100% protected" },
  { icon: RotateCcw,    title: "Easy Returns",     sub: "7-day return policy" },
  { icon: Headphones,   title: "24/7 Support",     sub: "We're always here" },
];

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="bg-brand text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Everything you need,
              <br />
              delivered fast.
            </h1>
            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
              Shop thousands of products from verified sellers with secure
              payments and hassle-free returns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 bg-white text-brand font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/signup" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map(({ name, icon: Icon }) => (
            <Link
              key={name}
              to={`/products?category=${name}`}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200 bg-white
                         hover:border-brand hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center group-hover:bg-brand transition-colors duration-200">
                <Icon className="w-5 h-5 text-brand group-hover:text-white transition-colors duration-200" />
              </div>
              <span className="text-xs font-medium text-gray-700">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products"
                className="text-sm font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden">
                <div className="skeleton aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-3 rounded w-1/3" />
                  <div className="skeleton h-4 rounded" />
                  <div className="skeleton h-4 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Trust Badges ──────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
          {TRUST.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="text-center">
              <div className="w-10 h-10 rounded-lg bg-brand-light mx-auto mb-3 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
