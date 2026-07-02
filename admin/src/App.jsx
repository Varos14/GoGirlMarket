import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, ClipboardList, Package } from 'lucide-react';
import DashboardScreen from './pages/DashboardScreen';
import UsersScreen from './pages/UsersScreen';
import OrdersScreen from './pages/OrdersScreen';
import VendorsScreen from './pages/VendorsScreen';
import ProductsScreen from './pages/ProductsScreen';
import LoginScreen from './pages/LoginScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';

function AdminLayout() {
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo || userInfo.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-surface font-sans">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-64 bg-gray-900 text-white flex-col z-20 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
        
        <div className="p-4 flex-grow flex flex-col gap-2 mt-6 z-10">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-4 opacity-70">Admin Console</p>
          
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${location.pathname === '/' ? 'bg-primary/20 text-primary shadow-[inset_4px_0_0_0_#E91E63]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            <LayoutDashboard size={20} className={location.pathname === '/' ? 'text-primary' : ''} />
            Dashboard
          </Link>
          <Link to="/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${location.pathname === '/users' ? 'bg-primary/20 text-primary shadow-[inset_4px_0_0_0_#E91E63]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            <Users size={20} className={location.pathname === '/users' ? 'text-primary' : ''} />
            Users
          </Link>
          <Link to="/vendors" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${location.pathname === '/vendors' ? 'bg-primary/20 text-primary shadow-[inset_4px_0_0_0_#E91E63]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            <Store size={20} className={location.pathname === '/vendors' ? 'text-primary' : ''} />
            Vendors
          </Link>
          <Link to="/orders" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${location.pathname === '/orders' ? 'bg-primary/20 text-primary shadow-[inset_4px_0_0_0_#E91E63]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            <ClipboardList size={20} className={location.pathname === '/orders' ? 'text-primary' : ''} />
            Orders
          </Link>
          <Link to="/products" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${location.pathname === '/products' ? 'bg-primary/20 text-primary shadow-[inset_4px_0_0_0_#E91E63]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
            <Package size={20} className={location.pathname === '/products' ? 'text-primary' : ''} />
            Products
          </Link>
        </div>
        
        <div className="p-4 border-t border-gray-800/50 z-10 bg-gray-900/50 backdrop-blur-sm">
          <button 
            onClick={() => {
              localStorage.removeItem('userInfo');
              window.location.href = '/login';
            }}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 w-full transition-all duration-300"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-4 sm:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="GoGirl Market" className="h-10 w-auto" />
            </Link>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <h2 className="text-xl font-heading font-extrabold text-gray-800 tracking-tight hidden sm:block">Admin Platform</h2>
          </div>
          
          <div className="flex items-center gap-5 cursor-pointer hover:bg-surface/50 p-2 pr-4 rounded-full transition-all duration-300 border border-transparent hover:border-gray-200">
            <div className="text-right">
              <p className="font-semibold text-sm text-textPrimary leading-tight">{userInfo.name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Superadmin</p>
            </div>
            <div className="h-11 w-11 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-bold shadow-lg uppercase text-sm border-2 border-white">
              {userInfo.name.substring(0, 2)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-4 sm:p-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/users" element={<UsersScreen />} />
            <Route path="/vendors" element={<VendorsScreen />} />
            <Route path="/products" element={<ProductsScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-800 flex justify-around items-center h-16 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)] pb-safe">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Dashboard</span>
        </Link>
        <Link to="/users" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/users' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Users size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Users</span>
        </Link>
        <Link to="/vendors" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/vendors' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Store size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Vendors</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/orders' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <ClipboardList size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Orders</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/products' ? 'text-primary' : 'text-gray-400 hover:text-primary transition-colors'}`}>
          <Package size={20} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Products</span>
        </Link>
      </nav>
    </div>
  );
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
      <Route path="/*" element={<AdminLayout />} />
    </Routes>
  );
};

export default App;
