import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Truck } from 'lucide-react';

const DisputesScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDisputes = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/orders/disputes/all', config);
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
    fetchDisputes();
  }, []);

  const resolveDisputeHandler = async (id, vendorId, action) => {
    const confirmMsg = action === 'approve_refund' 
      ? 'Approve refund for this package dispute? Buyer will receive funds back.'
      : 'Release funds to vendor? Seller will retain escrow funds.';
      
    if (window.confirm(confirmMsg)) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/orders/${id}/dispute/resolve`, { vendorId, action }, config);
        fetchDisputes();
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
            <ShieldCheck size={28} className="text-rose-500" />
            Dispute Resolution
          </h1>
          <p className="text-xs text-textMuted mt-1">Resolve active buyer disputes. Refund buyer or release funds to vendor.</p>
        </div>
        <span className="pill-badge bg-rose-50 text-rose-700 text-xs font-bold w-max border border-rose-200">
          {orders.length} Active Disputes
        </span>
      </div>

      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-200" />
            <p>No active disputes to resolve.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Dispute Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {orders.map((order) => {
                  const activeDisputes = order.vendorOrders?.filter(vo => vo.disputeStatus === 'Open') || [];

                  return activeDisputes.map((activeDispute, idx) => (
                    <tr key={`${order._id}-${idx}`} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-primary">#{order._id.substring(0, 8)}</td>
                      <td className="py-4 px-4 font-semibold text-primary">{order.user ? order.user.name : 'Customer'}</td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 block w-max">
                            ⚠️ Active Dispute
                          </span>
                          <p className="text-[11px] text-textMuted mt-1">Reason: {activeDispute.disputeReason}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => resolveDisputeHandler(order._id, activeDispute.vendor, 'approve_refund')}
                          className="btn-primary py-1 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                          title="Approve Customer Refund"
                        >
                          Refund Buyer
                        </button>
                        <button
                          onClick={() => resolveDisputeHandler(order._id, activeDispute.vendor, 'release')}
                          className="btn-secondary py-1 px-2.5 text-[10px] border border-rose-200 text-rose-700 hover:bg-rose-50"
                          title="Release to Vendor"
                        >
                          Release to Vendor
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputesScreen;
