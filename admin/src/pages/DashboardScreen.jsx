import React, { useState, useEffect } from 'react';
import { Users, DollarSign, ShoppingBag, Store, TrendingUp, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 7800 },
  { name: 'May', revenue: 6500 },
  { name: 'Jun', revenue: 9800 },
];

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalVendors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          throw new Error('Not logged in. Please log in on the main store first.');
        }
        const userInfo = JSON.parse(userInfoStr);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/orders/stats', config);
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch stats', error);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-gray-800 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          Download Report
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-2xl shadow-[0_8px_30px_rgb(233,30,99,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <span className="flex items-center text-xs font-bold bg-white/20 px-2 py-1 rounded-full"><TrendingUp size={12} className="mr-1" /> +12.5%</span>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-3xl font-bold font-heading">UGX {stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-secondary">
                  <Store size={20} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><ArrowUpRight size={12} className="mr-1" /> +4</span>
              </div>
              <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Vendors</p>
              <h3 className="text-3xl font-bold font-heading text-gray-800">{stats.totalVendors}</h3>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Users size={20} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><ArrowUpRight size={12} className="mr-1" /> +84</span>
              </div>
              <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-bold font-heading text-gray-800">{stats.totalUsers}</h3>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ShoppingBag size={20} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><ArrowUpRight size={12} className="mr-1" /> +12</span>
              </div>
              <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-3xl font-bold font-heading text-gray-800">{stats.totalOrders}</h3>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-gray-800">Revenue Overview</h2>
              <select className="border border-gray-200 text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E91E63" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E91E63" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `UGX ${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#E91E63', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#E91E63" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardScreen;
