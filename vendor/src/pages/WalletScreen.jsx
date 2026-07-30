import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react';

const WalletScreen = () => {
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) return;
      const vendorInfo = JSON.parse(vendorInfoStr);

      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
      const { data } = await axios.get('/api/wallet', config);
      
      setWallet(data.wallet || { availableBalance: 0, pendingBalance: 0 });
      setTransactions(data.transactions || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);


  const getTransactionIcon = (type) => {
    switch(type) {
      case 'credit_pending': return <Clock size={20} className="text-amber-500" />;
      case 'cleared': return <ArrowDownLeft size={20} className="text-emerald-500" />;
      case 'withdrawal': return <ArrowUpRight size={20} className="text-rose-500" />;
      default: return <Wallet size={20} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200">Pending</span>;
      case 'completed': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">Completed</span>;
      case 'failed': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200">Failed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Wallet & Payouts</h1>
          <p className="text-xs text-textMuted mt-1">Manage payout requests, available store revenue balance, and transaction history.</p>
        </div>
        <span className="pill-badge bg-softRose text-accent text-xs font-bold w-max">
          UGX {wallet.availableBalance.toLocaleString()} Available
        </span>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Balances & Withdraw Form */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Available Balance */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background border-borderLight flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="pill-badge bg-emerald-50 text-emerald-600 border border-emerald-100">Ready to Withdraw</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Banknote size={18}/></div>
              </div>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Available Balance</p>
              <h2 className="text-3xl font-heading font-bold text-primary">UGX {wallet.availableBalance.toLocaleString()}</h2>
            </div>

            {/* Pending Balance */}
            <div className="vendor-card p-6 bg-gradient-to-br from-surface to-background border-borderLight flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="pill-badge bg-amber-50 text-amber-600 border border-amber-100">Clears post delivery</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><Clock size={18}/></div>
              </div>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">Pending Clearance</p>
              <h2 className="text-2xl font-heading font-bold text-primary">UGX {wallet.pendingBalance.toLocaleString()}</h2>
            </div>

            {/* Automated Payouts Banner */}
            <div className="vendor-card p-6 bg-gray-900 text-white flex flex-col justify-between rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white bg-white/20 border border-white/10">System Controlled</span>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle size={20}/>
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-heading font-bold text-lg mb-2">Automated Payouts</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Your Available Balance is automatically deposited into your registered bank or mobile money account every week. 
                </p>
                <p className="text-xs text-gray-400 mt-4 border-t border-white/10 pt-3">
                  No manual withdrawal requests required.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <h3 className="font-heading font-bold text-xl mb-6 text-gray-800 border-b pb-2">Account Statement</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                  <Wallet size={48} className="mb-4 text-gray-200" />
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          tx.type === 'withdrawal' ? 'bg-rose-100' : 
                          tx.type === 'cleared' ? 'bg-emerald-100' : 'bg-amber-100'
                        }`}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm line-clamp-1">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                            {tx.type === 'credit_pending' && tx.status === 'pending' && tx.clearanceDate && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                Clears {new Date(tx.clearanceDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`font-bold ${
                          tx.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {tx.type === 'withdrawal' ? '-' : '+'}UGX {tx.amount.toLocaleString()}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default WalletScreen;
