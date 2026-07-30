import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import { Star, Heart, TrendingUp } from 'lucide-react';
import axios from 'axios';
import FlashSaleBanner from '../components/FlashSaleBanner';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productList = useSelector((state) => state.products);
  const { loading, error, products } = productList;
  const { userInfo } = useSelector((state) => state.auth);

  const [featuredProducts, setFeaturedProducts] = React.useState([]);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);

  useEffect(() => {
    dispatch(fetchProducts());
    
    // Fetch featured products safely
    const fetchFeatured = async () => {
      try {
        const { data } = await axios.get('/api/products?featured=true');
        setFeaturedProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        console.warn('Featured products unavailable:', err?.message || err);
        setFeaturedProducts([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, [dispatch]);

  const addToCartHandler = (product) => {
    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      countInStock: product.countInStock,
      qty: 1
    }));
    navigate('/cart');
  };

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
    <div className="space-y-12 pb-12">
      {/* Shoppe Hero Carousel Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#F7EFE9] via-[#FDF8F5] to-[#F3ECE5] overflow-hidden shadow-sm border border-borderLight min-h-[420px] md:min-h-[480px] flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-14 z-10 w-full">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-primary leading-tight">
                Embrace Your <br />
                <span className="italic font-normal text-accent">Signature</span> Style.
              </h1>
              <p className="text-textMuted text-base sm:text-lg max-w-md">
                Discover curated fashion, beauty essentials, and trending artisanal products designed to empower every moment.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link to="/shop" className="btn-primary py-3.5 px-8 text-sm shadow-md hover:shadow-lg flex items-center gap-2">
                  Shop Collection
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link to="/shop?category=deals" className="btn-secondary py-3.5 px-6 text-sm">
                  Explore Deals
                </Link>
              </div>
            </div>

            <div className="relative w-full py-2 sm:py-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-softRose/70 via-cream/40 to-transparent rounded-full filter blur-3xl transform scale-95 pointer-events-none"></div>
              
              {/* Asymmetrical Floating Lookbook Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-3.5 sm:gap-5 max-w-md lg:max-w-lg mx-auto">
                
                {/* Section 1: Clothing - Tall Card */}
                <Link 
                  to="/shop?category=Clothing" 
                  className="group relative h-48 sm:h-56 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-4 border-surface transform -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all duration-500"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop" 
                    alt="Clothing Category" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-md text-primary text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1 border border-surface/50">
                      👗 Clothing
                    </span>
                    <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </Link>

                {/* Section 2: Shoes - Offset Card */}
                <Link 
                  to="/shop?category=Shoes" 
                  className="group relative h-40 sm:h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-4 border-surface transform rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all duration-500 mt-4"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop" 
                    alt="Shoes Category" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-md text-primary text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1 border border-surface/50">
                      👠 Shoes
                    </span>
                    <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </Link>

                {/* Section 3: Handbags */}
                <Link 
                  to="/shop?category=Bags" 
                  className="group relative h-40 sm:h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-4 border-surface transform rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all duration-500 -mt-2"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop" 
                    alt="Bags Category" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-md text-primary text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1 border border-surface/50">
                      👜 Bags
                    </span>
                    <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </Link>

                {/* Section 4: Accessories - Tall Offset Card */}
                <Link 
                  to="/shop?category=Accessories" 
                  className="group relative h-48 sm:h-56 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border-4 border-surface transform -rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all duration-500 -mt-6"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop" 
                    alt="Accessories Category" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-md text-primary text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1 border border-surface/50">
                      🕶️ Accessories
                    </span>
                    <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals & Live Countdown Section */}
      <FlashSaleBanner />

      {/* Category Quick Pills / Avatars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold text-primary">Shop by Category</h2>
          <Link to="/shop" className="text-xs font-bold text-accent hover:underline">View All</Link>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {[
            { name: "All", icon: "✨", cat: "" },
            { name: "Clothing", icon: "👗", cat: "Clothing" },
            { name: "Beauty", icon: "💄", cat: "Beauty" },
            { name: "Bags", icon: "👜", cat: "Bags" },
            { name: "Shoes", icon: "👠", cat: "Shoes" },
            { name: "Jewelry", icon: "💎", cat: "Jewelry" },
            { name: "Accessories", icon: "🕶️", cat: "Accessories" }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to={item.cat ? `/shop?category=${item.cat}` : "/shop"} 
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-full bg-surface border border-borderLight shadow-xs hover:border-accent hover:bg-cream transition-all group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-xs font-semibold text-textPrimary group-hover:text-accent whitespace-nowrap">{item.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Premium / Trending Section */}
      {!loadingFeatured && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-cream/60 rounded-3xl p-6 sm:p-10 border border-borderLight">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <span className="pill-badge bg-softRose text-accent mb-2">⭐ Editor's Pick</span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Featured Essentials</h2>
              </div>
              <Link to="/shop" className="btn-secondary text-xs py-2.5 px-5">Explore Collection</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="shoppe-card group">
                  <div className="relative h-72 bg-surface overflow-hidden">
                    <button 
                      onClick={(e) => addToWishlist(e, product._id)}
                      className="absolute top-3 right-3 h-8 w-8 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-textMuted hover:text-accent transition-colors shadow-xs z-20"
                    >
                      <Heart size={16} />
                    </button>
                    <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider z-20 shadow-xs">
                      Featured
                    </span>
                    <Link to={`/product/${product._id}`}>
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </Link>
                  </div>
                  <div className="p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">{product.vendor?.storeName || 'Boutique'}</p>
                      <h3 className="font-heading font-semibold text-base text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-borderLight">
                      <span className="font-bold text-primary text-sm">UGX {product.price.toLocaleString()}</span>
                      <button 
                        onClick={() => addToCartHandler(product)}
                        className="btn-primary py-1.5 px-4 text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Product Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="pill-badge bg-softRose text-accent mb-1 font-semibold text-[10px] uppercase tracking-wider">🔥 Popular Styles</span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Trending Now</h2>
            <p className="text-xs text-textMuted mt-0.5">Handpicked fashion & footwear favorites from top sellers</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
            Browse All <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((product, index) => (
              <div key={product._id} className="shoppe-card group flex flex-col justify-between">
                <div className="relative h-56 sm:h-72 bg-surface overflow-hidden">
                  <button 
                    onClick={(e) => addToWishlist(e, product._id)}
                    className="absolute top-3 right-3 h-8 w-8 bg-surface/80 backdrop-blur rounded-full flex items-center justify-center text-textMuted hover:text-accent transition-colors shadow-xs z-20"
                    title="Add to Wishlist"
                  >
                    <Heart size={16} />
                  </button>
                  
                  {/* Dynamic Discount / Sponsored Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
                    {index % 3 === 0 && (
                      <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        -20% OFF
                      </span>
                    )}
                    {product.isSponsored && (
                      <span className="bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <TrendingUp size={10} /> Sponsored
                      </span>
                    )}
                  </div>

                  <Link to={`/product/${product._id}`} onClick={() => handleProductClick(product)}>
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                </div>
                <div className="p-3 sm:p-4 flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-textMuted uppercase tracking-wider">{product.vendor?.storeName || 'Fashion Hub'}</p>
                    <h3 className="font-heading font-semibold text-sm sm:text-base text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-borderLight">
                    <div>
                      <span className="font-bold text-primary text-xs sm:text-sm">UGX {product.price.toLocaleString()}</span>
                      {index % 3 === 0 && (
                        <span className="text-[10px] text-textMuted line-through block font-normal">UGX {Math.round(product.price * 1.25).toLocaleString()}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCartHandler(product)}
                      className="btn-secondary py-1 px-3 text-[11px] sm:text-xs font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
