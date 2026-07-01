import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Users } from 'lucide-react';
import axios from 'axios';

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const vendorInfoStr = localStorage.getItem('vendorInfo');
        if (!vendorInfoStr) throw new Error('Not logged in');
        const vendorInfo = JSON.parse(vendorInfoStr);
        
        const config = {
          headers: { Authorization: `Bearer ${vendorInfo.token}` },
        };

        // Fetch vendor products and orders in parallel
        const [productsRes, ordersRes] = await Promise.all([
          axios.get(`/api/products?vendor=${vendorInfo._id}`, config),
          axios.get('/api/orders/vendor', config)
        ]);

        const products = productsRes.data.products || [];
        const orders = ordersRes.data || [];

        // Calculate Revenue (only paid orders)
        const totalRevenue = orders
          .filter(order => order.isPaid)
          .reduce((acc, order) => {
            // Find items belonging to this vendor
            const vendorItems = order.orderItems.filter(
              item => item.product && item.product.vendor === vendorInfo._id
            );
            const orderRevenue = vendorItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
            return acc + orderRevenue;
          }, 0);

        // Calculate unique customers
        const uniqueCustomers = new Set(orders.map(order => order.user?._id)).size;

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalCustomers: uniqueCustomers,
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
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-8">Dashboard Overview</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-2xl shadow-[0_8px_30px_rgb(233,30,99,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-3xl font-bold font-heading">UGX {stats.totalRevenue.toLocaleString()}</h3>
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
            
            {/* Customers Card */}
            <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-6 rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.2)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <Users size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Users size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Unique Customers</p>
                <h3 className="text-3xl font-bold font-heading">{stats.totalCustomers}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                    stats.recentOrders.map(order => (
                      <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-4">#{order._id.substring(18)}</td>
                        <td className="py-4">{order.user?.name || 'Unknown User'}</td>
                        <td className="py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardScreen;
