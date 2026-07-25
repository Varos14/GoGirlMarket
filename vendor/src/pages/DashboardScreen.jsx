import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Users, BadgeCheck, Copy, TrendingUp } from 'lucide-react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalOrders: 0,
    totalProducts: 0,
    recentOrders: [],
    revenueData: [],
    topProducts: [],
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [success, setSuccess] = useState('');

  const getStoreUrl = (slug) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:5173/store/${slug}`;
    }
    return `https://go-girl-market-client.vercel.app/store/${slug}`;
  };

  const copyStoreLink = () => {
    if (vendorInfo?.storeSlug) {
      navigator.clipboard.writeText(getStoreUrl(vendorInfo.storeSlug));
      setSuccess('Store link copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const vendorInfoStr = localStorage.getItem('vendorInfo');
        if (!vendorInfoStr) throw new Error('Not logged in');
        const parsedVendorInfo = JSON.parse(vendorInfoStr);
        setVendorInfo(parsedVendorInfo);

        const config = {
          headers: { Authorization: `Bearer ${parsedVendorInfo.token}` },
        };

        // Fetch analytics, orders, and wallet in parallel
        const [analyticsRes, ordersRes, walletRes] = await Promise.all([
          axios.get('/api/vendors/analytics', config),
          axios.get('/api/orders/vendor', config),
          axios.get('/api/wallet', config)
        ]);

        const analytics = analyticsRes.data;
        const orders = ordersRes.data || [];
        const wallet = walletRes.data.wallet || { availableBalance: 0, pendingBalance: 0 };

        setStats({
          availableBalance: wallet.availableBalance,
          pendingBalance: wallet.pendingBalance,
          totalOrders: analytics.totalOrders,
          totalProducts: analytics.totalProducts,
          totalRevenue: analytics.totalRevenue,
          revenueData: analytics.revenueData,
          topProducts: analytics.topProducts,
          recentOrders: orders.slice(0, 5) // top 5 recent
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">
              Welcome back, {vendorInfo?.name}
            </h1>
            {vendorInfo?.isVerified && (
              <span className="pill-badge bg-emerald-50 text-emerald-600 border border-emerald-200">
                <BadgeCheck size={14} /> Verified Store
              </span>
            )}
          </div>
          <p className="text-xs text-textMuted mt-1">Here is a quick overview of your store's sales performance and active orders today.</p>
        </div>

        {vendorInfo?.storeSlug && (
          <button 
            onClick={copyStoreLink} 
            className="btn-secondary py-2.5 px-4 text-xs font-semibold shadow-xs border border-borderLight w-max flex items-center gap-2"
          >
            <Copy size={16} /> Copy Store Link
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          {/* Stat Cards - Styled matching Admin Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Available Balance Card */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <span className="pill-badge bg-emerald-50 text-emerald-700 text-[10px]">Available</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Available Payout</p>
                <h3 className="text-2xl font-heading font-bold text-primary">UGX {stats.availableBalance.toLocaleString()}</h3>
              </div>
            </div>

            {/* Total Orders Card */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <span className="pill-badge bg-blue-50 text-blue-700 text-[10px]">Orders</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Total Store Orders</p>
                <h3 className="text-2xl font-heading font-bold text-primary">{stats.totalOrders}</h3>
              </div>
            </div>

            {/* Listed Products Card */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <span className="pill-badge bg-purple-50 text-purple-700 text-[10px]">Catalog</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Products Listed</p>
                <h3 className="text-2xl font-heading font-bold text-primary">{stats.totalProducts}</h3>
              </div>
            </div>

            {/* Pending Balance Card */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <span className="pill-badge bg-amber-50 text-amber-700 text-[10px]">Pending</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Pending Clearance</p>
                <h3 className="text-2xl font-heading font-bold text-primary">UGX {stats.pendingBalance.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Charts & Table Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="vendor-card p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-borderLight pb-4">
                <TrendingUp size={20} className="text-accent" />
                <h2 className="text-lg font-heading font-bold text-primary">Revenue Trend</h2>
              </div>
              
              {stats.revenueData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-textMuted text-xs">Not enough data to display</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEFEF" />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: '#71747D'}} tickMargin={10} stroke="#EFEFEF" />
                      <YAxis tick={{fontSize: 11, fill: '#71747D'}} tickFormatter={(val) => `UGX ${val/1000}k`} stroke="#EFEFEF" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '14px', border: '1px solid #EFEFEF', backgroundColor: '#FFF' }}
                        formatter={(value) => `UGX ${value.toLocaleString()}`} 
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#FF5A5F" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Selling Products Bar Chart */}
            <div className="vendor-card p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-borderLight pb-4">
                <Package size={20} className="text-primary" />
                <h2 className="text-lg font-heading font-bold text-primary">Top Selling Products</h2>
              </div>
              
              {stats.topProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-textMuted text-xs">No products sold yet</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EFEFEF" />
                      <XAxis type="number" stroke="#EFEFEF" tick={{fontSize: 11, fill: '#71747D'}} />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#71747D'}} width={100} stroke="#EFEFEF" />
                      <Tooltip formatter={(value) => [`${value} units`, 'Sold']} />
                      <Bar dataKey="qty" fill="#FF5A5F" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Recent Orders Table */}
            <div className="vendor-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4 border-b border-borderLight pb-3">
                <h2 className="text-lg font-heading font-bold text-primary">Recent Customer Orders</h2>
                <span className="pill-badge bg-cream text-textMuted text-xs">
                  {stats.recentOrders.length} Latest Orders
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4 text-right">Fulfillment & Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {stats.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-textMuted font-medium">No store orders received yet.</td>
                      </tr>
                    ) : (
                      stats.recentOrders.map(order => {
                        const isDelivered = order.vendorDetails?.isDelivered;
                        
                        return (
                          <tr key={order._id} className="hover:bg-cream/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-primary">
                              #{order._id.substring(18)}
                            </td>
                            <td className="py-4 px-4 font-semibold text-primary">
                              {order.user?.name || 'Customer'}
                            </td>
                            <td className="py-4 px-4 text-textMuted">
                              {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                order.isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                              }`}>
                                {order.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                              {isDelivered && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                  Delivered
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardScreen;
