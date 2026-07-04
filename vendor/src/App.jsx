import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Wallet, Tag } from 'lucide-react';
import DashboardScreen from './pages/DashboardScreen';
import ProductsScreen from './pages/ProductsScreen';
import OrdersScreen from './pages/OrdersScreen';
import CouponsScreen from './pages/CouponsScreen';
import SettingsScreen from './pages/SettingsScreen';
import WalletScreen from './pages/WalletScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';

function App() {
  const location = useLocation();
  const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));

  if (!vendorInfo || (vendorInfo.role !== 'vendor' && vendorInfo.role !== 'admin')) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  const isActive = (path) => {
    return location.pathname === path 
      ? "text-primary font-bold border-b-2 border-primary" 
      : "text-gray-600 hover:text-primary transition-colors font-semibold";
  };

  return (
    <div className="min-h-screen bg-surface font-sans flex flex-col">
      {/* Top Header Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
              <img src="/logo.png" alt="GoGirl Market" className="h-8 sm:h-10 w-auto" />
              <span className="hidden sm:block text-xl font-heading font-extrabold text-gray-800 tracking-tight border-l-2 pl-4 border-gray-200">
                Vendor Platform
              </span>
            </div>

            {/* Centered Navigation (Desktop) */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className={`flex items-center gap-2 py-2 ${isActive('/')}`}>
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link to="/products" className={`flex items-center gap-2 py-2 ${isActive('/products')}`}>
                <Package size={18} />
                Products
              </Link>
              <Link to="/orders" className={`flex items-center gap-2 py-2 ${isActive('/orders')}`}>
                <ShoppingBag size={18} />
                Orders
              </Link>
              <Link to="/coupons" className={`flex items-center gap-2 py-2 ${isActive('/coupons')}`}>
                <Tag size={18} />
                Coupons
              </Link>
              <Link to="/wallet" className={`flex items-center gap-2 py-2 ${isActive('/wallet')}`}>
                <Wallet size={18} />
                Wallet
              </Link>
              <Link to="/settings" className={`flex items-center gap-2 py-2 ${isActive('/settings')}`}>
                <Settings size={18} />
                Settings
              </Link>
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-sm text-textPrimary">{vendorInfo.name}</p>
                  <p className="text-xs text-gray-500">{vendorInfo.storeName}</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md uppercase text-xs sm:text-sm">
                  {vendorInfo.name.substring(0, 2)}
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('vendorInfo');
                  window.location.href = '/';
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 animate-fade-in">
        <Routes>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/products" element={<ProductsScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/coupons" element={<CouponsScreen />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Dashboard</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/products' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Package size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Products</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/orders' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <ShoppingBag size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Orders</span>
        </Link>
        <Link to="/coupons" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/coupons' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Tag size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Coupons</span>
        </Link>
        <Link to="/wallet" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/wallet' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Wallet size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Wallet</span>
        </Link>
        <Link to="/settings" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/settings' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default App;
