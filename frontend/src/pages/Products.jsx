// ============================================================
//  src/pages/Products.jsx — Product listing with filters
// ============================================================
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Home", "Sports", "Beauty"];

const Products = () => {
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search")   || "");
  const [search,      setSearch]      = useState(searchParams.get("search")   || "");
  const [category,    setCategory]    = useState(searchParams.get("category") || "All");
  const [minPrice,    setMinPrice]    = useState(searchParams.get("minPrice") || "");
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get("maxPrice") || "");
  const [sort,        setSort]        = useState(searchParams.get("sort")     || "newest");
  const [page,        setPage]        = useState(1);

  const [products,   setProducts]   = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchInput]);

  // Fetch products
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

  const handleFilter = (key, value) => {
    if (key === "search") {
      setSearchInput(value);
    } else {
      setPage(1);
      if (key === "category") setCategory(value);
      if (key === "minPrice") setMinPrice(value);
      if (key === "maxPrice") setMaxPrice(value);
      if (key === "sort")     setSort(value);
    }
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters = category !== "All" || minPrice || maxPrice || search;

  // Sidebar content — shared between desktop and mobile
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleFilter("search", e.target.value)}
            placeholder="Search products..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
          Category
        </label>
        <div className="space-y-0.5">
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

      {/* Price */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
          Price Range (₹)
        </label>
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
      {hasActiveFilters && (
        <button onClick={handleReset} className="btn-secondary w-full text-sm">
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading..." : `${total} products found`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => handleFilter("sort", e.target.value)}
            className="input-field w-44 text-sm hidden sm:block"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden btn-secondary py-2 px-3"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="card sticky top-24">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Filters</h2>
            <FilterContent />
          </div>
        </aside>

        {/* Product grid */}
        <main className="flex-1 min-w-0">

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse p-0">
                  <div className="aspect-square bg-gray-100 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">No products found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                    ${page === i + 1
                      ? "bg-brand text-white"
                      : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-1.5 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
