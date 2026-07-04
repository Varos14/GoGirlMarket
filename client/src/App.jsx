import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import HomeScreen from './pages/HomeScreen';
import ShopScreen from './pages/ShopScreen';
import ProductDetailsScreen from './pages/ProductDetailsScreen';
import ShippingScreen from './pages/ShippingScreen';
import PaymentScreen from './pages/PaymentScreen';
import PlaceOrderScreen from './pages/PlaceOrderScreen';
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
import { logout } from './store/authSlice';

function App() {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const userInfo = useSelector((state) => state.auth.userInfo);
  const dispatch = useDispatch();

  const logoutHandler = () => {
    dispatch(logout());
  };
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <img src="/logo.png" alt="GoGirl Market" className="h-10 w-auto" />
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex space-x-10">
            <Link to="/" className="text-gray-600 hover:text-primary transition-colors font-semibold tracking-wide text-sm uppercase">Home</Link>
            <Link to="/shop" className="text-gray-600 hover:text-primary transition-colors font-semibold tracking-wide text-sm uppercase">Shop</Link>
            <Link to="/shop?category=Beauty" className="text-gray-600 hover:text-primary transition-colors font-semibold tracking-wide text-sm uppercase">Beauty</Link>
            <Link to="/shop?category=deals" className="text-highlight hover:text-yellow-600 transition-colors font-bold tracking-wide text-sm uppercase flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Deals
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            
            {/* Search Box */}
            <SearchBox />

            {/* Auth / Profile */}
            {userInfo ? (
              <div className="flex items-center gap-4 border-l pl-6 border-gray-200">
                <Link to="/profile" className="text-sm font-bold text-gray-700 hover:text-primary transition-colors hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                  {userInfo.name.split(' ')[0]}
                </Link>
                <button onClick={logoutHandler} className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors border-l pl-6 border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-bold hidden sm:inline">Sign In</span>
              </Link>
            )}
            
            {/* Cart */}
            <Link to="/cart" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>
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
          <Route path="/shipping" element={<ShippingScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/placeorder" element={<PlaceOrderScreen />} />
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
      
      <Footer />
      <ChatbotWidget />
    </div>
  );
}

export default App;
