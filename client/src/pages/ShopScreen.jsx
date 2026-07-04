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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <h3 className="text-xl font-heading font-bold mb-4 border-b pb-2">Categories</h3>
          <ul className="space-y-3 mb-8 text-gray-600">
            <li><Link to="/shop" className={`hover:text-primary transition-colors ${!categoryParam ? 'font-bold text-primary' : ''}`}>All Products</Link></li>
            <li><Link to="/shop?category=Fashion" className={`hover:text-primary transition-colors ${categoryParam === 'Fashion' ? 'font-bold text-primary' : ''}`}>👗 Fashion</Link></li>
            <li><Link to="/shop?category=Shoes" className={`hover:text-primary transition-colors ${categoryParam === 'Shoes' ? 'font-bold text-primary' : ''}`}>👠 Shoes</Link></li>
            <li><Link to="/shop?category=Beauty" className={`hover:text-primary transition-colors ${categoryParam === 'Beauty' ? 'font-bold text-primary' : ''}`}>💄 Beauty</Link></li>
            <li><Link to="/shop?category=Skincare" className={`hover:text-primary transition-colors ${categoryParam === 'Skincare' ? 'font-bold text-primary' : ''}`}>🧴 Skincare</Link></li>
            <li><Link to="/shop?category=Bags" className={`hover:text-primary transition-colors ${categoryParam === 'Bags' ? 'font-bold text-primary' : ''}`}>👜 Bags</Link></li>
          </ul>

          <h3 className="text-xl font-heading font-bold mb-4 border-b pb-2">Price Range</h3>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" className="w-full p-2 border rounded-md outline-none focus:border-primary" />
            <input type="number" placeholder="Max" className="w-full p-2 border rounded-md outline-none focus:border-primary" />
          </div>
          <button className="w-full btn-secondary mt-4 py-2">Apply Filter</button>
        </div>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-heading font-bold text-textPrimary">
              {keywordParam ? `Search Results for "${keywordParam}"` : 'All Products'}
            </h2>
            <select 
              className="border p-2 rounded-md bg-white outline-none focus:border-primary cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Sort by: Newest</option>
              <option value="lowest">Price: Low to High</option>
              <option value="highest">Price: High to Low</option>
            </select>
          </div>

          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <div key={product._id} className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${product.isSponsored ? 'ring-1 ring-indigo-500/30' : ''}`}>
                      <Link to={`/product/${product._id}`} className="relative block" onClick={() => handleProductClick(product)}>
                        <div className="h-56 bg-surface flex items-center justify-center cursor-pointer relative group">
                          {product.isSponsored && (
                            <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1">
                              <TrendingUp size={12} /> Sponsored
                            </div>
                          )}
                          <img src={product.images?.[0] || 'https://via.placeholder.com/800x800.png?text=No+Image'} alt={product.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white text-textPrimary px-6 py-2 font-bold rounded-md shadow-md transform translate-y-4 group-hover:translate-y-0 transition-transform">View Details</span>
                          </div>
                        </div>
                      </Link>
                      <button 
                        onClick={(e) => addToWishlist(e, product._id)}
                        className="absolute top-3 right-3 h-10 w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-primary transition-colors shadow-sm z-10"
                        title="Add to Wishlist"
                      >
                        <Heart size={18} />
                      </button>
                      <div className="p-4 flex flex-col flex-grow">
                        <div>
                          <h3 className="font-heading font-semibold text-lg text-textPrimary line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{product.vendor?.storeName || 'Vendor'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                          <span className="font-bold text-primary">UGX {product.price?.toLocaleString()}</span>
                          <Link to={`/product/${product._id}`} className="text-sm btn-secondary py-1 px-3 inline-block text-center">
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-lg font-medium">No products found in this category.</p>
                  </div>
                )}
              </div>

              {/* Infinite Scroll Target */}
              {page < pages && (
                <div ref={observerTarget} className="flex justify-center items-center py-8 mt-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              
              {!loading && products.length > 0 && page === pages && (
                <div className="text-center py-8 text-gray-500 mt-8">
                  <p>You have reached the end of the list.</p>
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
