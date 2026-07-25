import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react';

const WalletScreen = () => {
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    
    if (amount > wallet.availableBalance) {
      setMessage({ type: 'error', text: 'Insufficient available balance' });
      return;
    }

    if (!accountBank || !accountNumber) {
      setMessage({ type: 'error', text: 'Please provide Bank Code and Account Number' });
      return;
    }

    setWithdrawing(true);
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      const vendorInfo = JSON.parse(vendorInfoStr);
      const config = { headers: { Authorization: `Bearer ${vendorInfo.token}` } };
      
      await axios.post('/api/wallet/withdraw', { 
        amount,
        account_bank: accountBank,
        account_number: accountNumber
      }, config);
      
      setMessage({ type: 'success', text: 'Withdrawal processed successfully. Funds are on the way!' });
      setWithdrawAmount('');
      fetchWallet(); // Refresh data
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error requesting withdrawal' });
    }
    setWithdrawing(false);
  };

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

            {/* Withdraw Form */}
            <div className="vendor-card p-6">
              <h3 className="font-heading font-bold text-base text-primary mb-4 border-b border-borderLight pb-3">Request Payout</h3>
              
              {message.text && (
                <div className={`p-3 rounded-2xl mb-4 text-xs font-semibold flex items-start gap-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {message.type === 'error' ? <AlertCircle size={15} className="mt-0.5 flex-shrink-0"/> : <CheckCircle size={15} className="mt-0.5 flex-shrink-0"/>}
                  <p>{message.text}</p>
                </div>
              )}

              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-bold mb-2">Amount (UGX)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g. 50000"
                    min="1000"
                    max={wallet.availableBalance}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-bold mb-2">Bank / Mobile Money Provider Code</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={accountBank}
                    onChange={(e) => setAccountBank(e.target.value)}
                  >
                    <option value="">Select Provider</option>
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="AIRTEL">Airtel Money</option>
                    <option value="FCMB">FCMB</option>
                    <option value="044">Access Bank</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-600 text-sm font-bold mb-2">Account Number / Phone Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g. 0770000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={withdrawing || wallet.availableBalance <= 0}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {withdrawing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Withdraw Funds Instantly'
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-3 text-center">Funds will be sent automatically via Flutterwave Transfers.</p>
              </form>
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
