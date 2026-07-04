import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';

const WishlistScreen = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=/wishlist');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/users/wishlist', config);
        setWishlist(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userInfo, navigate]);

  const removeFromWishlist = async (productId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      await axios.delete(`/api/users/wishlist/${productId}`, config);
      setWishlist(wishlist.filter(item => item._id !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-primary">
          <Heart fill="currentColor" size={24} />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-gray-800">My Wishlist</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-gray-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Heart size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Explore our marketplace and tap the heart icon to save items you love for later.
          </p>
          <Link to="/shop" className="btn-primary py-3 px-8 rounded-full font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2">
            <ShoppingBag size={18} />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative h-64 bg-gray-100">
                <img 
                  src={product.images?.[0] || 'https://via.placeholder.com/400x400.png?text=No+Image'} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => removeFromWishlist(product._id)}
                  className="absolute top-3 right-3 h-10 w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="p-4">
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-heading font-bold text-gray-800 line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                </Link>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-primary">UGX {product.price?.toLocaleString()}</span>
                  <Link 
                    to={`/product/${product._id}`}
                    className="text-xs font-bold uppercase tracking-wider bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistScreen;
