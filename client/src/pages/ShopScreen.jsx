import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice';
import { Link, useLocation } from 'react-router-dom';
import { Heart, TrendingUp } from 'lucide-react';
import axios from 'axios';

const ShopScreen = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category') || '';
  const keywordParam = queryParams.get('keyword') || '';
  const [sort, setSort] = useState('newest');

  const productList = useSelector((state) => state.products);
  const { loading, error, products, page, pages } = productList;
  
  const { userInfo } = useSelector((state) => state.auth);

  // Ref for the observer target
  const observerTarget = useRef(null);
  const [isFetching, setIsFetching] = useState(false);

  // Initial load or sort/filter change
  useEffect(() => {
    dispatch(fetchProducts({ category: categoryParam, keyword: keywordParam, sort, pageNumber: 1 }));
  }, [dispatch, categoryParam, keywordParam, sort]);

  // Observer callback for infinite scroll
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && page < pages && !loading && !isFetching) {
      setIsFetching(true);
      dispatch(fetchProducts({ category: categoryParam, keyword: keywordParam, sort, pageNumber: page + 1 }))
        .finally(() => setIsFetching(false));
    }
  }, [dispatch, categoryParam, keywordParam, sort, page, pages, loading, isFetching]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Title & Breadcrumb */}
      <div className="mb-8 border-b border-borderLight pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Catalog</span>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary">
            {keywordParam ? `Results for "${keywordParam}"` : categoryParam ? `${categoryParam} Collection` : 'All Products'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-textMuted">Sort by:</span>
          <select 
            className="bg-surface border border-borderLight text-xs font-semibold text-primary py-2.5 px-4 rounded-full outline-none focus:border-accent cursor-pointer shadow-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-surface p-6 rounded-3xl border border-borderLight shadow-xs h-fit">
          <div>
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-2 text-xs">
              {[
                { label: 'All Products', value: '' },
                { label: '👗 Fashion', value: 'Fashion' },
                { label: '👠 Shoes', value: 'Shoes' },
                { label: '💄 Beauty', value: 'Beauty' },
                { label: '🧴 Skincare', value: 'Skincare' },
                { label: '👜 Bags', value: 'Bags' },
                { label: '👗 Clothing', value: 'Clothing' },
                { label: '🕶️ Accessories', value: 'Accessories' },
              ].map((cat, idx) => (
                <li key={idx}>
                  <Link 
                    to={cat.value ? `/shop?category=${cat.value}` : '/shop'} 
                    className={`block py-2 px-3 rounded-xl transition-all ${
                      categoryParam.toLowerCase() === cat.value.toLowerCase() ? 'bg-cream text-accent font-bold shadow-xs' : 'text-textMuted hover:text-primary hover:bg-background'
                    }`}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-borderLight pt-4">
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-3">Price Filter</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" className="w-full p-2.5 text-xs bg-background border border-borderLight rounded-xl outline-none focus:border-accent" />
              <input type="number" placeholder="Max" className="w-full p-2.5 text-xs bg-background border border-borderLight rounded-xl outline-none focus:border-accent" />
            </div>
            <button className="w-full btn-secondary mt-3 py-2 text-xs">Apply Filter</button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <div key={product._id} className="shoppe-card group flex flex-col justify-between">
                      <div className="relative h-64 bg-surface overflow-hidden">
                        <button 
                          onClick={(e) => addToWishlist(e, product._id)}
                          className="absolute top-3 right-3 h-8 w-8 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-textMuted hover:text-accent transition-colors shadow-xs z-20"
                          title="Add to Wishlist"
                        >
                          <Heart size={16} />
                        </button>
                        {product.isSponsored && (
                          <div className="absolute top-3 left-3 bg-accent text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider z-20 shadow-xs flex items-center gap-1">
                            <TrendingUp size={10} /> Sponsored
                          </div>
                        )}
                        {product.flashSalePrice && (
                          <div className="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-20 shadow-xs flex items-center gap-1 animate-pulse">
                            🔥 Flash Deal
                          </div>
                        )}
                        <Link to={`/product/${product._id}`} onClick={() => handleProductClick(product)}>
                          <img src={product.images?.[0] || 'https://via.placeholder.com/800x800.png?text=No+Image'} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </Link>
                      </div>

                      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">{product.vendor?.storeName || 'Store Boutique'}</p>
                          <h3 className="font-heading font-semibold text-base text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-borderLight mt-auto">
                          <div>
                            {product.flashSalePrice ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-accent text-base">UGX {product.flashSalePrice.toLocaleString()}</span>
                                <span className="text-[10px] text-textMuted line-through">UGX {product.price?.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-primary text-sm">UGX {product.price?.toLocaleString()}</span>
                            )}
                          </div>
                          <Link to={`/product/${product._id}`} className="btn-secondary py-1.5 px-4 text-xs">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-textMuted bg-surface rounded-3xl border border-borderLight p-8 text-center">
                    <span className="text-4xl mb-3">🛍️</span>
                    <p className="text-base font-semibold text-primary">No products found</p>
                    <p className="text-xs text-textMuted mt-1">Try resetting your search query or filters.</p>
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
                  <p>You've reached the end of the collection ✨</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
