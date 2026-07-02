import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import { Star } from 'lucide-react';
import axios from 'axios';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const productList = useSelector((state) => state.products);
  const { loading, error, products } = productList;

  const [featuredProducts, setFeaturedProducts] = React.useState([]);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);

  useEffect(() => {
    dispatch(fetchProducts());
    
    // Fetch featured products
    const fetchFeatured = async () => {
      try {
        const { data } = await axios.get('/api/products?featured=true');
        setFeaturedProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching featured products', err);
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

  return (
    <div>
      <section className="relative bg-white overflow-hidden border-b">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-20">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-textPrimary sm:text-5xl md:text-6xl font-heading">
                  <span className="block xl:inline">Everything She Loves,</span>{' '}
                  <span className="block text-primary xl:inline">Delivered.</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Uganda's premier marketplace for women's fashion, beauty, and lifestyle products. Shop beautiful, live confident.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/shop" className="w-full flex items-center justify-center btn-primary text-lg px-8 py-3">
                      Start Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-surface">
          <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center bg-gray-100 overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary opacity-10 group-hover:opacity-0 transition-opacity duration-500 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070&auto=format&fit=crop" 
              alt="Women's boutique interior" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {!loadingFeatured && featuredProducts.length > 0 && (
        <div className="bg-amber-50/50 py-16 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Star size={20} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-gray-900">Featured Premium</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="bg-white rounded-xl border border-amber-100 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 relative">
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Featured
                    </span>
                  </div>
                  <Link to={`/product/${product._id}`}>
                    <div className="h-64 bg-surface flex items-center justify-center relative group">
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-textPrimary px-4 py-2 font-bold rounded-md shadow-md">View Details</span>
                       </div>
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col justify-between h-40">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 font-medium">{product.vendor?.storeName || 'Premium Boutique'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="font-bold text-primary text-lg">UGX {product.price.toLocaleString()}</span>
                      <button 
                        onClick={() => addToCartHandler(product)}
                        className="text-sm bg-gray-900 hover:bg-primary text-white font-bold py-1.5 px-4 rounded-md transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-heading font-bold text-textPrimary mb-8">Latest Fashion & Beauty</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <Link to={`/product/${product._id}`}>
                  <div className="h-64 bg-surface flex items-center justify-center relative group">
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white text-textPrimary px-4 py-2 font-bold rounded-md shadow-md">View Details</span>
                     </div>
                  </div>
                </Link>
                <div className="p-4 flex flex-col justify-between h-40">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-textPrimary line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.vendor?.storeName || 'Boutique'}</p>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-bold text-primary">UGX {product.price.toLocaleString()}</span>
                    <button 
                      onClick={() => addToCartHandler(product)}
                      className="text-sm btn-secondary py-1 px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
