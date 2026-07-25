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
      ? "text-accent font-bold bg-cream px-3 py-1.5 rounded-full shadow-xs" 
      : "text-textMuted hover:text-primary transition-colors font-semibold px-3 py-1.5 rounded-full hover:bg-background";
  };

  return (
    <div className="min-h-screen bg-background font-sans text-textPrimary flex flex-col pb-16 md:pb-0">
      {/* Top Header Navigation */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-borderLight transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <img src="/logo.png" alt="GoGirl Market" className="h-10 sm:h-12 w-auto object-contain" />
              <span className="hidden sm:inline-block pill-badge bg-softRose text-accent text-[10px] uppercase font-bold tracking-wider">
                Vendor Hub
              </span>
            </div>

            {/* Centered Navigation (Desktop) */}
            <nav className="hidden md:flex items-center space-x-2 bg-background p-1.5 rounded-full border border-borderLight">
              <Link to="/" className={`flex items-center gap-1.5 text-xs ${isActive('/')}`}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link to="/products" className={`flex items-center gap-1.5 text-xs ${isActive('/products')}`}>
                <Package size={15} />
                Products
              </Link>
              <Link to="/orders" className={`flex items-center gap-1.5 text-xs ${isActive('/orders')}`}>
                <ShoppingBag size={15} />
                Orders
              </Link>
              <Link to="/coupons" className={`flex items-center gap-1.5 text-xs ${isActive('/coupons')}`}>
                <Tag size={15} />
                Coupons
              </Link>
              <Link to="/wallet" className={`flex items-center gap-1.5 text-xs ${isActive('/wallet')}`}>
                <Wallet size={15} />
                Wallet
              </Link>
              <Link to="/settings" className={`flex items-center gap-1.5 text-xs ${isActive('/settings')}`}>
                <Settings size={15} />
                Settings
              </Link>
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-cream text-primary border border-borderLight flex items-center justify-center font-bold text-xs shadow-xs">
                  {vendorInfo.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="font-bold text-xs text-primary leading-tight">{vendorInfo.name}</p>
                  <p className="text-[10px] text-textMuted">{vendorInfo.storeName || 'Vendor'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('vendorInfo');
                  window.location.href = '/';
                }}
                className="p-2 text-textMuted hover:text-accent transition-colors rounded-full hover:bg-cream"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-borderLight flex justify-between items-center h-16 px-4 z-50 shadow-lg">
        <Link to="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/products' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Package size={18} />
          <span>Products</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/orders' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <ShoppingBag size={18} />
          <span>Orders</span>
        </Link>
        <Link to="/coupons" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/coupons' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Tag size={18} />
          <span>Coupons</span>
        </Link>
        <Link to="/wallet" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/wallet' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Wallet size={18} />
          <span>Wallet</span>
        </Link>
      </nav>
    </div>
  );
}

export default App;
