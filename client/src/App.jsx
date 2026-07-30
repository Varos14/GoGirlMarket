import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import HomeScreen from './pages/HomeScreen';
import ShopScreen from './pages/ShopScreen';
import ProductDetailsScreen from './pages/ProductDetailsScreen';
import CheckoutScreen from './pages/CheckoutScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import ProfileScreen from './pages/ProfileScreen';
import OrderScreen from './pages/OrderScreen';
import CartScreen from './pages/CartScreen';
import InfoPageScreen from './pages/InfoPageScreen';
import VendorStoreScreen from './pages/VendorStoreScreen';
import WishlistScreen from './pages/WishlistScreen';
import Footer from './components/Footer';
import SearchBox from './components/SearchBox';
import ChatbotWidget from './components/ChatbotWidget';
import CartDrawer from './components/CartDrawer';
import { logout } from './store/authSlice';
import { openCartDrawer } from './store/cartSlice';

function App() {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const userInfo = useSelector((state) => state.auth.userInfo);
  const dispatch = useDispatch();

  const logoutHandler = () => {
    dispatch(logout());
  };
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-textPrimary pb-16 md:pb-0">
      {/* Top Banner Announcement */}
      <div className="bg-primary text-white text-xs font-medium py-2 px-4 text-center tracking-wide flex justify-center items-center gap-2">
        <span>🚚 <strong>Free Shipping</strong> on all orders over UGX 300,000 | Fast Delivery Across Uganda</span>
      </div>

      {/* Navbar */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-borderLight transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <img src="/logo.png" alt="GoGirl Market" className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform" />
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-textPrimary hover:text-accent font-semibold tracking-wide text-xs uppercase transition-colors">Home</Link>

            {/* Shop All with Dropdown */}
            <div className="relative group">
              <Link to="/shop" className="text-textMuted group-hover:text-accent font-semibold tracking-wide text-xs uppercase transition-colors py-2 flex items-center gap-1">
                Shop All
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-surface rounded-2xl border border-borderLight shadow-lg p-2 space-y-1 z-50 animate-fadeIn">
                <Link to="/shop" className="block px-4 py-2 text-xs font-semibold text-textPrimary hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  🛍️ All Collections
                </Link>
                <Link to="/shop?category=Clothing" className="block px-4 py-2 text-xs font-semibold text-textMuted hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  👗 Clothing
                </Link>
                <Link to="/shop?category=Shoes" className="block px-4 py-2 text-xs font-semibold text-textMuted hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  👠 Shoes
                </Link>
                <Link to="/shop?category=Beauty" className="block px-4 py-2 text-xs font-semibold text-textMuted hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  💄 Beauty & Skincare
                </Link>
                <Link to="/shop?category=Accessories" className="block px-4 py-2 text-xs font-semibold text-textMuted hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  🕶️ Accessories
                </Link>
                <Link to="/shop?category=Bags" className="block px-4 py-2 text-xs font-semibold text-textMuted hover:bg-cream hover:text-accent rounded-xl transition-colors">
                  👜 Handbags
                </Link>
              </div>
            </div>

            <Link to="/shop?category=deals" className="pill-badge bg-softRose text-accent hover:bg-accent hover:text-white transition-all text-xs uppercase font-bold tracking-wider">
              🔥 Hot Deals
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4 sm:gap-6">

            {/* Search Box */}
            <div className="hidden sm:block">
              <SearchBox />
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 text-textPrimary hover:text-accent transition-colors relative rounded-full hover:bg-cream">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart Button */}
            <button 
              onClick={() => dispatch(openCartDrawer())} 
              className="p-2 text-textPrimary hover:text-accent transition-colors relative rounded-full hover:bg-cream"
              aria-label="Open Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile */}
            {userInfo ? (
              <div className="flex items-center gap-3 pl-2 sm:border-l border-borderLight">
                <Link to="/profile" className="text-xs font-bold text-textPrimary hover:text-accent transition-colors flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-cream text-primary border border-borderLight flex items-center justify-center font-bold text-xs shadow-sm">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{userInfo.name.split(' ')[0]}</span>
                </Link>
                <button onClick={logoutHandler} className="text-textMuted hover:text-accent transition-colors text-xs font-semibold hidden sm:block">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-5 text-xs font-semibold hidden sm:inline-flex">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/product/:id" element={<ProductDetailsScreen />} />
          <Route path="/store/:slug" element={<VendorStoreScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/order/:id" element={<OrderScreen />} />
          <Route path="/wishlist" element={<WishlistScreen />} />

          {/* Static Pages */}
          <Route path="/contact" element={<InfoPageScreen title="Contact Us" content={<><p>Need help? We're here for you.</p><p>Email us at: <strong>support@gogirlmarket.com</strong></p><p>Call us at: <strong>+256 123 456 789</strong></p></>} />} />
          <Route path="/shipping-returns" element={<InfoPageScreen title="Shipping & Returns" content={<><p>We offer reliable shipping across the globe.</p><h3>Returns Policy</h3><p>If you're not fully satisfied, you have 30 days to return the item in its original condition.</p></>} />} />
          <Route path="/faq" element={<InfoPageScreen title="Frequently Asked Questions" content={<><h3 className="font-bold">How long does shipping take?</h3><p>Typically 3-5 business days for local deliveries.</p><h3 className="font-bold mt-4">Can I change my order?</h3><p>Yes, within 24 hours of placing it.</p></>} />} />
          <Route path="/privacy" element={<InfoPageScreen title="Privacy Policy" content={<><p>We take your privacy seriously. We will never sell or rent your personal information to third parties.</p><p>All transactions are secured using industry standard encryption.</p></>} />} />
          <Route path="/terms" element={<InfoPageScreen title="Terms of Service" content={<><p>By using GoGirl Market, you agree to follow our community guidelines.</p><p>GoGirl Market is a platform that connects buyers with independent women-owned businesses.</p></>} />} />
        </Routes>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-borderLight z-50 px-6 py-2 flex justify-between items-center shadow-lg">
        <Link to="/" className="flex flex-col items-center gap-1 text-textMuted hover:text-accent focus:text-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        <Link to="/shop" className="flex flex-col items-center gap-1 text-textMuted hover:text-accent focus:text-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] font-semibold">Shop</span>
        </Link>

        <Link to="/wishlist" className="flex flex-col items-center gap-1 text-textMuted hover:text-accent focus:text-accent transition-colors relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-semibold">Wishlist</span>
        </Link>

        <button 
          onClick={() => dispatch(openCartDrawer())}
          className="flex flex-col items-center gap-1 text-textMuted hover:text-accent focus:text-accent transition-colors relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-accent text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">Cart</span>
        </button>

        <Link to={userInfo ? "/profile" : "/login"} className="flex flex-col items-center gap-1 text-textMuted hover:text-accent focus:text-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-semibold">{userInfo ? "Account" : "Sign In"}</span>
        </Link>
      </nav>

      <Footer />
      <CartDrawer />
      <ChatbotWidget />
    </div>
  );
}

export default App;
