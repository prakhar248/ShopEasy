// ============================================================
//  src/pages/SellerStore.jsx
//  Displays all products from a specific seller
// ============================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const SellerStore = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState("Seller");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/seller/${sellerId}`);
        setProducts(res.data.products || []);
        
        // Extract seller name from first product
        if (res.data.products && res.data.products.length > 0) {
          setSellerName(res.data.products[0].seller?.name || "Seller Store");
        }
      } catch (err) {
        console.error("Error fetching seller products:", err);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchProducts();
    }
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{sellerName}</h1>
        <p className="text-gray-500 mt-2">{products.length} products available</p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-gray-600 text-lg">No products found from this seller.</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-in-out"
          >
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerStore;
