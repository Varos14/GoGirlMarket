import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Truck } from 'lucide-react';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/orders', config);
      setOrders(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const deliverHandler = async (id) => {
    if (window.confirm('Admin Override: Mark this order as delivered?')) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        await axios.put(`/api/orders/${id}/deliver`, {}, config);
        fetchOrders(); // Refresh list
      } catch (error) {
        alert('Error updating order');
      }
    }
  };

  const updateStatusHandler = async (id, status) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(`/api/orders/${id}/status`, { status }, config);
      fetchOrders();
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const resolveDisputeHandler = async (id, vendorId, action) => {
    const confirmMsg = action === 'approve_refund' 
      ? 'Approve refund for this package dispute? Buyer will receive funds back.'
      : 'Reject dispute? Seller will retain escrow funds.';
      
    if (window.confirm(confirmMsg)) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/orders/${id}/dispute/resolve`, { vendorId, action }, config);
        fetchOrders();
      } catch (error) {
        alert(error.response?.data?.message || 'Error resolving dispute');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <ShieldCheck size={28} className="text-accent" />
            Global Orders & Dispute Resolution
          </h1>
          <p className="text-xs text-textMuted mt-1">Track platform orders, override statuses, and resolve buyer dispute refund claims.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          {orders.length} Global Orders
        </span>
      </div>

      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Dispute Status</th>
                  <th className="py-3 px-4">Order Lifecycle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {orders.map((order) => {
                  const activeDispute = order.vendorOrders?.find(vo => vo.disputeStatus === 'Open');

                  return (
                    <tr key={order._id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-primary">#{order._id.substring(0, 8)}</td>
                      <td className="py-4 px-4 font-semibold text-primary">{order.user ? order.user.name : 'Customer'}</td>
                      <td className="py-4 px-4 text-textMuted">{order.createdAt.substring(0, 10)}</td>
                      <td className="py-4 px-4 font-bold text-primary">UGX {order.totalPrice.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        {activeDispute ? (
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 animate-pulse block w-max">
                              ⚠️ Active Dispute
                            </span>
                            <p className="text-[10px] text-textMuted truncate max-w-[140px]">Reason: {activeDispute.disputeReason}</p>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-textMuted bg-cream">
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={order.status || 'Pending'}
                          onChange={(e) => updateStatusHandler(order._id, e.target.value)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            order.status === 'Out for Delivery' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5">
                        {activeDispute && (
                          <>
                            <button
                              onClick={() => resolveDisputeHandler(order._id, activeDispute.vendor, 'approve_refund')}
                              className="btn-primary py-1 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              title="Approve Customer Refund"
                            >
                              Approve Refund
                            </button>
                            <button
                              onClick={() => resolveDisputeHandler(order._id, activeDispute.vendor, 'reject')}
                              className="btn-secondary py-1 px-2.5 text-[10px] border border-rose-200 text-rose-700 hover:bg-rose-50"
                              title="Reject Dispute"
                            >
                              Reject Dispute
                            </button>
                          </>
                        )}
                        {order.status !== 'Delivered' && !activeDispute && (
                          <button 
                            onClick={() => deliverHandler(order._id)}
                            className="btn-secondary py-1 px-2.5 text-[10px]"
                            title="Force mark as delivered"
                          >
                            <Truck size={12} className="inline mr-1" /> Deliver
                          </button>
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
