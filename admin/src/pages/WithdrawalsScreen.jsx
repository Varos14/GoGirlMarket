import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Banknote, CheckCircle } from 'lucide-react';

const WithdrawalsScreen = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithdrawals = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/wallet/withdrawals', config);
      setWithdrawals(data);
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
    fetchWithdrawals();
  }, []);

  const markPaidHandler = async (id, amount) => {
    if (window.confirm(`Have you manually transferred UGX ${amount} to this user's account? Once marked as paid, the user will be notified.`)) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        await axios.put(`/api/wallet/withdrawals/${id}/approve`, {}, config);
        alert('Withdrawal marked as Paid successfully.');
        fetchWithdrawals();
      } catch (error) {
        alert(error.response?.data?.message || 'Error approving withdrawal');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <Banknote size={28} className="text-emerald-500" />
            Payout & Withdrawal Requests
          </h1>
          <p className="text-xs text-textMuted mt-1">Review pending withdrawal requests from vendors and buyers, transfer funds manually, and mark as paid.</p>
        </div>
        <span className="pill-badge bg-amber-50 text-amber-700 text-xs font-bold w-max border border-amber-200">
          {withdrawals.length} Pending Requests
        </span>
      </div>

      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">{error}</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
            <p>All caught up! No pending withdrawal requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Date Requested</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payout Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {withdrawals.map((withdrawal) => {
                  return (
                    <tr key={withdrawal._id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4 text-textMuted">{new Date(withdrawal.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-4 font-semibold text-primary">
                        {withdrawal.user?.name || 'Unknown User'}
                        <p className="text-[10px] text-textMuted font-normal">{withdrawal.user?.email}</p>
                        <p className="text-[10px] text-textMuted font-normal">{withdrawal.user?.phone}</p>
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600">UGX {withdrawal.amount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <div className="bg-gray-50 p-2 rounded text-[10px] text-gray-700 border border-gray-100">
                          {withdrawal.description.replace('Withdrawal Request to', 'Requested to:')}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => markPaidHandler(withdrawal._id, withdrawal.amount)}
                          className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                        >
                          Mark as Paid
                        </button>
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

export default WithdrawalsScreen;
