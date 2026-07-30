import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Banknote, CheckCircle, AlertCircle } from 'lucide-react';

const PayoutsScreen = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchPayableVendors = async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) throw new Error('Not logged in');
      const userInfo = JSON.parse(userInfoStr);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/wallet/payable-vendors', config);
      setVendors(data);
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
    fetchPayableVendors();
  }, []);

  const totalPayoutAmount = vendors.reduce((acc, vendor) => acc + (vendor.wallet?.availableBalance || 0), 0);

  const executeBulkPayoutHandler = async () => {
    if (window.confirm(`WARNING: This will instantly trigger a bulk bank transfer of UGX ${totalPayoutAmount.toLocaleString()} to ${vendors.length} vendors. Are you sure you want to proceed?`)) {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) throw new Error('Not logged in');
        const userInfo = JSON.parse(userInfoStr);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        const { data } = await axios.post('/api/wallet/bulk-payout', {}, config);
        setSuccessMessage(data.message || 'Bulk payout executed successfully.');
        fetchPayableVendors(); // Refresh list (should be empty now)
      } catch (error) {
        setError(error.response?.data?.message || 'Error executing bulk payout');
      }
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <Banknote size={28} className="text-emerald-500" />
            Weekly Bulk Payouts
          </h1>
          <p className="text-xs text-textMuted mt-1">Review vendors with cleared balances and execute the weekly automated sweep to their bank accounts.</p>
        </div>
        
        {vendors.length > 0 && (
          <button
            onClick={executeBulkPayoutHandler}
            disabled={processing}
            className="btn-primary py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Banknote size={20} />
                Pay UGX {totalPayoutAmount.toLocaleString()}
              </>
            )}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="admin-card p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
            <p>All caught up! No vendors currently have a payable balance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borderLight text-textMuted uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Vendor Details</th>
                  <th className="py-3 px-4">Payout Account</th>
                  <th className="py-3 px-4 text-right">Available Balance (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {vendors.map((vendor) => {
                  return (
                    <tr key={vendor._id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-4 px-4 font-semibold text-primary">
                        {vendor.storeName || vendor.name}
                        <p className="text-[10px] text-textMuted font-normal">{vendor.email}</p>
                        <p className="text-[10px] text-textMuted font-normal">{vendor.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        {vendor.payout?.bankCode && vendor.payout?.accountNumber ? (
                          <div className="bg-gray-50 p-2 rounded text-[10px] text-gray-700 border border-gray-100 inline-block">
                            {vendor.payout.bankCode} - {vendor.payout.accountNumber}
                          </div>
                        ) : (
                          <span className="text-rose-500 text-[10px] font-semibold bg-rose-50 px-2 py-1 rounded">Missing Details</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600 text-right text-base">
                        {vendor.wallet.availableBalance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50/50">
                <tr>
                  <td colSpan="2" className="py-4 px-4 font-bold text-gray-700 text-right">Total Bulk Payout:</td>
                  <td className="py-4 px-4 font-bold text-emerald-700 text-right text-lg border-t-2 border-emerald-200">
                    UGX {totalPayoutAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutsScreen;
