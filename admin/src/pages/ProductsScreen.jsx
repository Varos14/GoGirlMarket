import React, { useState, useEffect } from 'react';
import { Package, Star, Trash2 } from 'lucide-react';
import axios from 'axios';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products?pageSize=all');
      setProducts(data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleFeaturedHandler = async (id, currentStatus) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.put(`/api/products/${id}/featured`, { isFeatured: !currentStatus }, config);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update featured status');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <Package size={28} className="text-accent" />
            Global Product Management
          </h1>
          <p className="text-xs text-textMuted mt-1">Review all products submitted by sellers and toggle homepage featured status.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          {products.length} Products Listed
        </span>
      </div>

      {/* Catalog Table Container */}
      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Vendor Store</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Homepage Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-borderLight overflow-hidden shrink-0 shadow-xs">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-textMuted"><Package size={16}/></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-xs">{product.name}</p>
                          <span className="pill-badge text-[9px] mt-0.5">{product.category || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-textMuted">
                      {product.vendor?.storeName || product.vendor?.name || 'GoGirl Partner'}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      UGX {product.price?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {product.isFeatured ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 inline-flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Featured
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-textMuted bg-cream">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => toggleFeaturedHandler(product._id, product.isFeatured)} 
                        className={`btn-secondary py-1 px-3 text-[10px] font-semibold ${product.isFeatured ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}`}
                        title="Toggle Homepage Featured Status"
                      >
                        {product.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsScreen;
