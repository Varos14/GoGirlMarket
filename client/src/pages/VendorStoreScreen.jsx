import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BadgeCheck, Instagram, MessageCircle, MapPin, Calendar, Mail, Box } from 'lucide-react';

const VendorStoreScreen = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const { userInfo } = useSelector((state) => state.auth);
  
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fetchVendorStore = async () => {
      try {
        const { data } = await axios.get(`/api/users/store/${slug}`);
        setStoreData(data);
        setLoading(false);
        
        // If not logged in, redirect to login with a custom message
        if (!userInfo && data.vendor) {
          const storeName = data.vendor.storeName || data.vendor.name;
          navigate(`/login?redirect=/store/${slug}`, { 
            state: { message: `Please sign in or create an account to view ${storeName}'s store.` } 
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchVendorStore();
  }, [slug, navigate, userInfo]);

  // If user isn't logged in but data is fetching, or we are redirecting, just show a loading state
  if (loading || (!userInfo && !error)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">Oops! Store Not Found</h2>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block text-primary font-bold hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const { vendor, products } = storeData;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center text-primary text-5xl font-bold shadow-xl border-4 border-white/20 uppercase shrink-0">
            {vendor.storeName ? vendor.storeName.substring(0, 2) : vendor.name.substring(0, 2)}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 flex items-center gap-3">
              {vendor.storeName || vendor.name}
              {vendor.isVerified && (
                <BadgeCheck className="text-blue-400" size={32} title="Verified Vendor" />
              )}
            </h1>
            {vendor.tagline && (
              <p className="text-xl text-white/90 font-medium mb-4">{vendor.tagline}</p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/80 font-medium">
              {vendor.location && (
                <span className="flex items-center gap-1 bg-black/10 px-3 py-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {vendor.location}
                </span>
              )}
              {vendor.phone && (
                <span className="flex items-center gap-1 bg-black/10 px-3 py-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {vendor.phone}
                </span>
              )}
              {vendor.socialLinks?.instagram && (
                <a href={vendor.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-black/20 hover:bg-black/40 transition-colors px-3 py-1.5 rounded-full text-white cursor-pointer">
                  <Instagram size={16} /> Instagram
                </a>
              )}
              {vendor.socialLinks?.tiktok && (
                <a href={vendor.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-black/20 hover:bg-black/40 transition-colors px-3 py-1.5 rounded-full text-white cursor-pointer">
                  <MessageCircle size={16} /> TikTok
                </a>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('products')}
              className={`py-4 font-bold border-b-2 transition-colors ${activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              Products ({products.length})
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`py-4 font-bold border-b-2 transition-colors ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              About Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {activeTab === 'products' ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">
              All Products
            </h2>
            
            {products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-lg">This store doesn't have any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                    <Link to={`/product/${product._id}`}>
                      <div className="h-56 bg-surface flex items-center justify-center cursor-pointer relative group">
                        <img src={product.images?.[0] || 'https://via.placeholder.com/800x800.png?text=No+Image'} alt={product.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-textPrimary px-6 py-2 font-bold rounded-md shadow-md transform translate-y-4 group-hover:translate-y-0 transition-transform">View Details</span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col flex-grow">
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-textPrimary line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{vendor.storeName || vendor.name}</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-bold text-primary">UGX {product.price?.toLocaleString()}</span>
                        <Link to={`/product/${product._id}`} className="text-sm btn-secondary py-1 px-3 inline-block text-center">
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About Our Store</h2>
                {vendor.storeDescription ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vendor.storeDescription}</p>
                ) : (
                  <p className="text-gray-400 italic">This vendor hasn't provided a store description yet.</p>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-4 border-b">Store Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <BadgeCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                      <p className="font-medium text-gray-800">{vendor.isVerified ? 'Verified Vendor' : 'Unverified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Since</p>
                      <p className="font-medium text-gray-800">{new Date(vendor.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Box size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Products Available</p>
                      <p className="font-medium text-gray-800">{products.length} Items</p>
                    </div>
                  </div>

                  {vendor.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
                        <p className="font-medium text-gray-800">{vendor.location}</p>
                      </div>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Mail size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Email</p>
                        <a href={`mailto:${vendor.email}`} className="font-medium text-primary hover:underline truncate block">{vendor.email}</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorStoreScreen;
