import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp } from 'lucide-react';
import axios from 'axios';
import FlashSaleBanner from '../components/FlashSaleBanner';

const FlashSaleScreen = () => {
  const dispatch = useDispatch();
  
  const productList = useSelector((state) => state.products);
  const { loading, error, products, page, pages } = productList;
  
  const { userInfo } = useSelector((state) => state.auth);

  // Ref for the observer target
  const observerTarget = useRef(null);
  const [isFetching, setIsFetching] = useState(false);

  // Initial load
  useEffect(() => {
    dispatch(fetchProducts({ 
      isFlashSale: true,
      pageNumber: 1
    }));
  }, [dispatch]);

  // Observer callback for infinite scroll
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && page < pages && !loading && !isFetching) {
      setIsFetching(true);
      dispatch(fetchProducts({ 
        isFlashSale: true,
        pageNumber: page + 1
      }))
        .finally(() => setIsFetching(false));
    }
  }, [dispatch, page, pages, loading, isFetching]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  const addToWishlist = async (e, productId) => {
    e.preventDefault();
    if (!userInfo) {
      alert('Please log in to add items to your wishlist');
      return;
    }
    
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/users/wishlist', { productId }, config);
      alert('Added to wishlist!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  const handleProductClick = async (product) => {
    if (product.isSponsored) {
      try {
        await axios.post(`/api/products/${product._id}/click`);
      } catch (err) {
        console.error('Failed to register ad click', err);
      }
    }
  };

  return (
    <div className="pb-12 space-y-8">
      {/* Dynamic Flash Sale Banner */}
      <FlashSaleBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 pb-4 border-b border-borderLight flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">
              Today's Flash Deals
            </h1>
            <p className="text-xs text-textMuted mt-1">Don't miss out! Offers are valid until midnight.</p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-grow">
          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <div key={product._id} className="shoppe-card group flex flex-col justify-between">
                      <div className="relative h-56 sm:h-64 bg-surface overflow-hidden">
                        <button 
                          onClick={(e) => addToWishlist(e, product._id)}
                          className="absolute top-3 right-3 h-8 w-8 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-textMuted hover:text-accent transition-colors shadow-xs z-20"
                          title="Add to Wishlist"
                        >
                          <Heart size={16} />
                        </button>
                        
                        <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-20 shadow-xs flex items-center gap-1 animate-pulse">
                          🔥 Flash Deal
                        </div>
                        
                        <Link to={`/product/${product._id}`} onClick={() => handleProductClick(product)}>
                          <img src={product.images?.[0] || 'https://via.placeholder.com/800x800.png?text=No+Image'} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </Link>
                      </div>

                      <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-textMuted uppercase tracking-wider">{product.vendor?.storeName || 'Store Boutique'}</p>
                          <h3 className="font-heading font-semibold text-sm sm:text-base text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-borderLight mt-auto">
                          <div>
                            {product.flashSalePrice ? (
                              <div className="flex flex-col sm:flex-row items-baseline gap-0.5 sm:gap-1.5">
                                <span className="font-bold text-accent text-sm sm:text-base">UGX {product.flashSalePrice.toLocaleString()}</span>
                                <span className="text-[10px] text-textMuted line-through">UGX {product.price?.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-primary text-sm sm:text-base">UGX {product.price?.toLocaleString()}</span>
                            )}
                          </div>
                          <Link to={`/product/${product._id}`} className="btn-secondary py-1 px-3 text-[10px] sm:text-xs">
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-textMuted bg-surface rounded-3xl border border-borderLight p-8 text-center">
                    <span className="text-4xl mb-3">🔥</span>
                    <p className="text-base font-semibold text-primary">No active flash sales right now!</p>
                    <p className="text-xs text-textMuted mt-1">Check back later for exciting discounts.</p>
                  </div>
                )}
              </div>

              {/* Infinite Scroll Target */}
              {page < pages && (
                <div ref={observerTarget} className="flex justify-center items-center py-8 mt-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                </div>
              )}
              
              {!loading && products.length > 0 && page === pages && (
                <div className="text-center py-8 text-textMuted text-xs mt-8">
                  <p>You've seen all the deals! ✨</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashSaleScreen;
