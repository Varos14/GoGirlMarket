import React, { useState, useEffect } from 'react';
import { Package, Star, Trash2 } from 'lucide-react';
import axios from 'axios';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products?pageNumber=1');
      // For MVP, we are just fetching the first page, but we could add pagination
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
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-gray-800 flex items-center gap-3">
            <Package size={32} className="text-primary" />
            Product Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review all products and feature them on the homepage.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-100 border-collapse">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden shrink-0">
                           {product.images && product.images.length > 0 ? (
                               <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={16}/></div>
                           )}
                        </div>
                        <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{product.vendor?.storeName || 'Unknown Vendor'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">UGX {product.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isFeatured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          <Star size={12} fill="currentColor" /> Featured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => toggleFeaturedHandler(product._id, product.isFeatured)} className={`p-2 rounded-md transition-all border border-transparent hover:shadow-md ${product.isFeatured ? 'text-amber-500 hover:text-white hover:bg-amber-500' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`} title="Toggle Featured">
                        <Star size={16} />
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
