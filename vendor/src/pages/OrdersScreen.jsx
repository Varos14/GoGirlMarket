import React, { useState, useEffect } from 'react';
import { PackageOpen, MapPin } from 'lucide-react';
import axios from 'axios';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) throw new Error('Not logged in');
      const vendorInfo = JSON.parse(vendorInfoStr);
      
      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      const { data } = await axios.get('/api/orders/vendor', config);
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch vendor orders', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-textPrimary">Order Fulfillment</h1>
      </div>

      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-50 text-gray-400 p-6 rounded-full mb-6 shadow-inner">
              <PackageOpen size={56} />
            </div>
            <h3 className="text-2xl font-heading font-extrabold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">When customers buy your products, their orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Products</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shipping</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  // Find items that belong to the vendor
                  const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
                  const vendorItems = order.orderItems.filter(item => item.product && item.product.vendor === vendorInfo._id);
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-5 px-6">
                        <p className="font-extrabold text-gray-800">#{order._id.substring(18).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {order.user?.name ? order.user.name.substring(0, 2) : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{order.user?.name || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500 font-medium">{order.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1.5">
                          {vendorItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">{item.qty}x</span> 
                              <span className="font-medium line-clamp-1">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 w-max max-w-xs">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-600 line-clamp-2">
                            {order.shippingAddress.address}, {order.shippingAddress.city}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {order.isDelivered ? (
                          <span className="bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">Delivered</span>
                        ) : order.isPaid ? (
                          <span className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">To Ship</span>
                        ) : (
                          <span className="bg-red-50 border border-red-100 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">Unpaid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersScreen;
