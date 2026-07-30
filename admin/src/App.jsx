import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, ClipboardList, Package, ShieldCheck } from 'lucide-react';
import DashboardScreen from './pages/DashboardScreen';
import UsersScreen from './pages/UsersScreen';
import OrdersScreen from './pages/OrdersScreen';
import VendorsScreen from './pages/VendorsScreen';
import ProductsScreen from './pages/ProductsScreen';
import DisputesScreen from './pages/DisputesScreen';
import WithdrawalsScreen from './pages/WithdrawalsScreen';
import LoginScreen from './pages/LoginScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';

function AdminLayout() {
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo || userInfo.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => {
    return location.pathname === path 
      ? "text-accent font-bold bg-cream px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5" 
      : "text-textMuted hover:text-primary transition-colors font-semibold px-3 py-1.5 rounded-full hover:bg-background flex items-center gap-1.5";
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
                Admin Console
              </span>
            </div>

            {/* Centered Navigation (Desktop) */}
            <nav className="hidden md:flex items-center space-x-2 bg-background p-1.5 rounded-full border border-borderLight">
              <Link to="/" className={`text-xs ${isActive('/')}`}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link to="/users" className={`text-xs ${isActive('/users')}`}>
                <Users size={15} />
                Users
              </Link>
              <Link to="/vendors" className={`text-xs ${isActive('/vendors')}`}>
                <Store size={15} />
                Vendors
              </Link>
              <Link to="/orders" className={`text-xs ${isActive('/orders')}`}>
                <ClipboardList size={15} />
                Orders
              </Link>
              <Link to="/products" className={`text-xs ${isActive('/products')}`}>
                <Package size={15} />
                Products
              </Link>
              <Link to="/disputes" className={`text-xs ${isActive('/disputes')}`}>
                <ShieldCheck size={15} />
                Disputes
              </Link>
              <Link to="/withdrawals" className={`text-xs ${isActive('/withdrawals')}`}>
                <ClipboardList size={15} />
                Payouts
              </Link>
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-cream text-primary border border-borderLight flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInfo.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="font-bold text-xs text-primary leading-tight">{userInfo.name}</p>
                  <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Superadmin</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('userInfo');
                  window.location.href = '/login';
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
          <Route path="/users" element={<UsersScreen />} />
          <Route path="/vendors" element={<VendorsScreen />} />
          <Route path="/products" element={<ProductsScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/disputes" element={<DisputesScreen />} />
          <Route path="/withdrawals" element={<WithdrawalsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-borderLight flex justify-between items-center h-16 px-4 z-50 shadow-lg">
        <Link to="/" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link to="/users" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/users' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Users size={18} />
          <span>Users</span>
        </Link>
        <Link to="/vendors" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/vendors' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Store size={18} />
          <span>Vendors</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/orders' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <ClipboardList size={18} />
          <span>Orders</span>
        </Link>
        <Link to="/products" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${location.pathname === '/products' ? 'text-accent' : 'text-textMuted hover:text-accent'}`}>
          <Package size={18} />
          <span>Products</span>
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
