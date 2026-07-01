import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut } from 'lucide-react';
import DashboardScreen from './pages/DashboardScreen';
import ProductsScreen from './pages/ProductsScreen';
import OrdersScreen from './pages/OrdersScreen';
import SettingsScreen from './pages/SettingsScreen';
import LoginScreen from './pages/LoginScreen';

function App() {
  const location = useLocation();
  const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));

  if (!vendorInfo || (vendorInfo.role !== 'vendor' && vendorInfo.role !== 'admin')) {
    return (
      <Routes>
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
            <div className="flex-shrink-0 flex items-center gap-4">
              <img src="/logo.png" alt="GoGirl Market" className="h-10 w-auto" />
              <span className="text-xl font-heading font-extrabold text-gray-800 tracking-tight border-l-2 pl-4 border-gray-200">
                Vendor Platform
              </span>
            </div>

            {/* Centered Navigation */}
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
              <Link to="/settings" className={`flex items-center gap-2 py-2 ${isActive('/settings')}`}>
                <Settings size={18} />
                Settings
              </Link>
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-sm text-textPrimary">{vendorInfo.name}</p>
                  <p className="text-xs text-gray-500">{vendorInfo.storeName}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md uppercase">
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
                <LogOut size={20} />
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
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
