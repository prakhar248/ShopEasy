// ============================================================
//  src/pages/Products.jsx
//  Product listing with search, category filter, price range, pagination
// ============================================================

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Home", "Sports", "Beauty"];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query params (so links like /products?category=Books work)
  const [search,   setSearch]   = useState(searchParams.get("search")   || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort,     setSort]     = useState("-createdAt");
  const [page,     setPage]     = useState(1);

  const [products,   setProducts]   = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);

  // Fetch products whenever any filter/page changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ...(search   && { search }),
          ...(category !== "All" && { category }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          sort,
          page,
          limit: 12,
        });

        const { data } = await api.get(`/products?${params}`);
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, category, minPrice, maxPrice, sort, page]);

  // Reset to page 1 whenever a filter changes
  const handleFilter = (key, value) => {
    setPage(1);
    if (key === "search")   setSearch(value);
    if (key === "category") setCategory(value);
    if (key === "minPrice") setMinPrice(value);
    if (key === "maxPrice") setMaxPrice(value);
    if (key === "sort")     setSort(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Sidebar Filters ────────────────────────────── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="card space-y-6">
            <h2 className="font-bold text-gray-800 text-lg">Filters</h2>

            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => handleFilter("search", e.target.value)}
                placeholder="Search products..."
                className="input-field"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Category</label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleFilter("category", cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                      ${category === cat
                        ? "bg-brand text-white font-medium"
                        : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Price Range (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => handleFilter("minPrice", e.target.value)}
                  placeholder="Min"
                  className="input-field"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => handleFilter("maxPrice", e.target.value)}
                  placeholder="Max"
                  className="input-field"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setSearch(""); setCategory("All"); setMinPrice(""); setMaxPrice(""); setPage(1); }}
              className="w-full btn-secondary text-sm"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* ── Main Product Grid ───────────────────────────── */}
        <main className="flex-1">

          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{total} products found</p>
            <select
              value={sort}
              onChange={(e) => handleFilter("sort", e.target.value)}
              className="input-field w-auto text-sm"
            >
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Top Rated</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                  <div className="h-3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors
                    ${page === i + 1 ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
