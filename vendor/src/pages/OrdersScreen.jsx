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

  const markAsDelivered = async (orderId) => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) return;
      const vendorInfo = JSON.parse(vendorInfoStr);

      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      await axios.put(`/api/orders/${orderId}/deliver`, {}, config);
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark delivered', error);
      alert('Error marking order as delivered. Check console.');
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) return;
      const vendorInfo = JSON.parse(vendorInfoStr);

      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Error updating status. Check console.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Order Fulfillment</h1>
          <p className="text-xs text-textMuted mt-1">Track incoming customer purchases, update package dispatch, and confirm deliveries.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          {orders.length} Active Orders
        </span>
      </div>

      {/* Orders Table Container */}
      <div className="vendor-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-cream text-primary flex items-center justify-center border border-borderLight shadow-xs">
              <PackageOpen size={28} />
            </div>
            <h3 className="text-base font-heading font-bold text-primary">No Orders Yet</h3>
            <p className="text-xs text-textMuted max-w-sm">When customers purchase your products, order details and delivery info will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Shipping Destination</th>
                  <th className="py-3 px-4 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {orders.map(order => {
                  if (!order.vendorDetails) return null;
                  const vendorItems = order.vendorDetails.items;

                  return (
                    <tr key={order._id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4 font-semibold">
                        <p className="font-bold text-primary text-xs">#{order._id.substring(18).toUpperCase()}</p>
                        <p className="text-[10px] text-textMuted mt-0.5">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cream text-primary font-bold flex items-center justify-center text-[10px] border border-borderLight uppercase">
                            {order.user?.name ? order.user.name.substring(0, 2) : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-primary text-xs">{order.user?.name || 'Customer'}</p>
                            <p className="text-[10px] text-textMuted">{order.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {vendorItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-primary">
                              <span className="font-bold text-accent bg-softRose px-2 py-0.5 rounded-full text-[10px]">{item.qty}x</span>
                              <span className="font-semibold line-clamp-1">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-1.5 bg-background p-2.5 rounded-xl border border-borderLight max-w-xs">
                          <MapPin size={14} className="text-textMuted mt-0.5 flex-shrink-0" />
                          <div className="text-[11px]">
                            <p className="font-medium text-primary line-clamp-1">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                            <span className="text-[10px] text-textMuted">Fee: UGX {order.vendorDetails.shippingPrice?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {order.vendorDetails.isDelivered ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                            Delivered
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-wider">
                              {order.status || 'Pending'}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              {order.status !== 'Processing' && order.status !== 'Shipped' && (
                                <button 
                                  onClick={() => updateStatus(order._id, 'Processing')}
                                  className="btn-secondary py-1 px-2.5 text-[10px]"
                                >
                                  Packing
                                </button>
                              )}
                              {order.status !== 'Shipped' && (
                                <button 
                                  onClick={() => updateStatus(order._id, 'Shipped')}
                                  className="btn-secondary py-1 px-2.5 text-[10px]"
                                >
                                  Shipped
                                </button>
                              )}
                              <button 
                                onClick={() => markAsDelivered(order._id)}
                                className="btn-primary py-1 px-2.5 text-[10px]"
                              >
                                Delivered
                              </button>
                            </div>
                          </div>
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
