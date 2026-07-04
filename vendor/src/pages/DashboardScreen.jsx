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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-3xl font-heading font-bold text-textPrimary">Dashboard Overview</h1>
          {vendorInfo?.isVerified && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold text-sm border border-blue-100 shadow-sm w-max">
              <BadgeCheck size={16} /> Verified Vendor
            </span>
          )}
        </div>
        {vendorInfo?.storeSlug && (
          <button onClick={copyStoreLink} className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm w-max">
            <Copy size={18} /> Copy Store Link
          </button>
        )}
      </div>

      {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{success}</div>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Available Balance Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Available Balance</p>
                <h3 className="text-3xl font-bold font-heading">UGX {stats.availableBalance.toLocaleString()}</h3>
              </div>
            </div>

            {/* Orders Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <ShoppingBag size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total Orders</p>
                <h3 className="text-3xl font-bold font-heading">{stats.totalOrders}</h3>
              </div>
            </div>

            {/* Products Card */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <Package size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Package size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Products</p>
                <h3 className="text-3xl font-bold font-heading">{stats.totalProducts}</h3>
              </div>
            </div>

            {/* Pending Balance Card */}
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-6 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Pending Balance</p>
                <h3 className="text-3xl font-bold font-heading">UGX {stats.pendingBalance.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-emerald-500" />
                <h2 className="text-xl font-heading font-bold text-gray-800">Revenue Trend</h2>
              </div>
              
              {stats.revenueData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400">Not enough data to display</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
                      <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `UGX ${val/1000}k`} stroke="#9ca3af" />
                      <Tooltip formatter={(value) => `UGX ${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Package className="text-primary" />
                <h2 className="text-xl font-heading font-bold text-gray-800">Top Selling Products</h2>
              </div>
              
              {stats.topProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400">No products sold yet</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={100} />
                      <Tooltip formatter={(value) => [`${value} units`, 'Sold']} />
                      <Bar dataKey="qty" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
              <h2 className="text-xl font-heading font-bold mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-3 font-semibold">Order ID</th>
                      <th className="py-3 font-semibold">Customer</th>
                      <th className="py-3 font-semibold">Date</th>
                      <th className="py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-gray-500">No orders yet.</td>
                      </tr>
                    ) : (
                      stats.recentOrders.map(order => {
                        const isDelivered = order.vendorDetails?.isDelivered;
                        
                        return (
                          <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4">#{order._id.substring(18)}</td>
                            <td className="py-4">{order.user?.name || 'Unknown User'}</td>
                            <td className="py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 flex gap-2">
                              <span className={`${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                                {order.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                              {isDelivered && (
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
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
