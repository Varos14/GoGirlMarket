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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-borderLight pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Favorites</span>
          <h1 className="text-3xl font-heading font-bold text-primary">My Wishlist</h1>
        </div>
        <span className="pill-badge bg-cream text-primary text-xs font-semibold">{wishlist.length} saved items</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <span>{error}</span>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-borderLight text-center space-y-4">
          <span className="text-5xl">💖</span>
          <p className="text-base font-semibold text-primary">Your wishlist is empty.</p>
          <p className="text-xs text-textMuted max-w-sm mx-auto">Save your favorite items here so you can easily review or purchase them later.</p>
          <div className="pt-2">
            <Link to="/shop" className="btn-primary py-3 px-8 text-xs inline-block">
              Explore Collections
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product._id} className="shoppe-card group flex flex-col justify-between">
              <div className="relative h-64 bg-surface overflow-hidden">
                <button 
                  onClick={() => removeFromWishlist(product._id)}
                  className="absolute top-3 right-3 h-8 w-8 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-xs z-20"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={16} />
                </button>
                <Link to={`/product/${product._id}`}>
                  <img src={product.images?.[0] || 'https://via.placeholder.com/800x800.png?text=No+Image'} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
              </div>

              <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">{product.vendor?.storeName || 'Boutique'}</p>
                  <h3 className="font-heading font-semibold text-base text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-borderLight mt-auto">
                  <span className="font-bold text-primary text-sm">UGX {product.price?.toLocaleString()}</span>
                  <Link to={`/product/${product._id}`} className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
                    <ShoppingBag size={14} /> View
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
