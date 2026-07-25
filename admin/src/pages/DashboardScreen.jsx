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
    platformCommission: 0,
    adRevenue: 0,
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

  const exportReportCSV = () => {
    const reportDate = new Date().toLocaleDateString();
    const csvContent = [
      ['GoGirl Market - Admin Platform Summary Report'],
      [`Report Generated Date`, reportDate],
      [''],
      ['Metric', 'Value (UGX / Count)'],
      ['Gross Merchandise Value (GMV)', stats.totalRevenue || 0],
      ['Platform Commission Revenue', stats.platformCommission || 0],
      ['Ad Revenue', stats.adRevenue || 0],
      ['Total Registered Vendors', stats.totalVendors || 0],
      ['Total Registered Customers', stats.totalUsers || 0],
      ['Total Platform Orders', stats.totalOrders || 0]
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoGirlMarket_Admin_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Platform Overview</h1>
          <p className="text-xs text-textMuted mt-1">Real-time metrics, platform revenue split, and user growth insights.</p>
        </div>
        <button 
          onClick={exportReportCSV}
          className="btn-secondary py-2.5 px-5 text-xs font-semibold shadow-xs border border-borderLight w-max flex items-center gap-2"
        >
          <ArrowUpRight size={15} /> Download CSV Report
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Gross Merchandise Value (GMV) */}
            <div className="admin-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-accent border border-rose-100 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <span className="pill-badge bg-rose-50 text-accent text-[10px]">Gross Volume</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Total Merchandise Volume</p>
                <h3 className="text-2xl font-heading font-bold text-primary">UGX {stats.totalRevenue?.toLocaleString() || 0}</h3>
                
                <div className="mt-4 pt-3 border-t border-borderLight flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-textMuted block">Platform Fee</span>
                    <span className="font-bold text-emerald-600">UGX {stats.platformCommission?.toLocaleString() || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-textMuted block">Ad Revenue</span>
                    <span className="font-bold text-accent">UGX {stats.adRevenue?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Net Earnings Card */}
            <div className="admin-card p-6 bg-gradient-to-br from-emerald-50/50 via-surface to-background flex flex-col justify-between border-emerald-200 shadow-xs">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <span className="pill-badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">Founder Profit</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Founder Net Income</p>
                <h3 className="text-2xl font-heading font-bold text-emerald-700">
                  UGX {((stats.platformCommission || 0) + (stats.adRevenue || 0)).toLocaleString()}
                </h3>
                <div className="mt-3 pt-2.5 border-t border-emerald-100 flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-textMuted">Commission: <strong className="text-emerald-600">UGX {stats.platformCommission?.toLocaleString() || 0}</strong></span>
                  <span className="text-textMuted">Ad Spend: <strong className="text-accent">UGX {stats.adRevenue?.toLocaleString() || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Total Vendors */}
            <div className="admin-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Store size={20} />
                </div>
                <span className="pill-badge bg-purple-50 text-purple-700 text-[10px]">Sellers</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Registered Vendors</p>
                <h3 className="text-2xl font-heading font-bold text-primary">{stats.totalVendors || 0}</h3>
              </div>
            </div>

            {/* Total Users */}
            <div className="admin-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <span className="pill-badge bg-amber-50 text-amber-700 text-[10px]">Customers</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Customer Accounts</p>
                <h3 className="text-2xl font-heading font-bold text-primary">{stats.totalUsers || 0}</h3>
              </div>
            </div>

            {/* Total Orders */}
            <div className="admin-card p-6 bg-gradient-to-br from-surface to-background flex flex-col justify-between border-borderLight">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <span className="pill-badge bg-blue-50 text-blue-700 text-[10px]">Purchases</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Platform Orders</p>
                <h3 className="text-2xl font-heading font-bold text-primary">{stats.totalOrders || 0}</h3>
              </div>
            </div>

          </div>

          {/* Revenue Chart */}
          <div className="admin-card p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-borderLight pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-accent" />
                <h2 className="text-lg font-heading font-bold text-primary">Gross Sales Trend</h2>
              </div>
              <select className="border border-borderLight text-xs font-semibold rounded-xl px-3 py-1.5 bg-background outline-none focus:border-accent">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEFEF" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71747D', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71747D', fontSize: 11 }} tickFormatter={(value) => `UGX ${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #EFEFEF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#FFFFFF' }}
                    itemStyle={{ color: '#FF5A5F', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
