import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle, AlertCircle, Banknote, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WalletScreen = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchWallet = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
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
    if (user) fetchWallet();
  }, [user]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    const amount = Number(topUpAmount);
    if (!amount || amount < 1000) {
      setMessage({ type: 'error', text: 'Minimum top-up is UGX 1000' });
      return;
    }

    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/wallet/topup', { amount }, config);
      
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setMessage({ type: 'error', text: 'Failed to generate payment link' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error processing top-up' });
    }
    setProcessing(false);
  };

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

    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/wallet/withdraw', { 
        amount,
        account_bank: accountBank,
        account_number: accountNumber
      }, config);
      
      setMessage({ type: 'success', text: 'Withdrawal request submitted. Admin will process it shortly.' });
      setWithdrawAmount('');
      fetchWallet();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error requesting withdrawal' });
    }
    setProcessing(false);
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'wallet_topup': return <CreditCard size={20} className="text-blue-500" />;
      case 'withdrawal_request': return <ArrowUpRight size={20} className="text-amber-500" />;
      case 'withdrawal': return <ArrowUpRight size={20} className="text-rose-500" />;
      case 'refund': return <ArrowDownLeft size={20} className="text-emerald-500" />;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">My Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your store credit and withdrawal requests.</p>
        </div>
        <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
          UGX {wallet.availableBalance.toLocaleString()} Available
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balances & Forms */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Top Up Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-base text-primary mb-4 border-b pb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-500"/> Top Up Balance
            </h3>
            
            <form onSubmit={handleTopUp}>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-bold mb-2">Amount (UGX)</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Min. UGX 1000"
                  min="1000"
                />
              </div>
              <button
                type="submit"
                disabled={processing || !topUpAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                Top Up via Pesapal
              </button>
            </form>
          </div>

          {/* Withdraw Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-base text-primary mb-4 border-b pb-3 flex items-center gap-2">
              <Banknote size={18} className="text-emerald-500"/> Request Withdrawal
            </h3>
            
            {message.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g. 50000"
                  min="1000"
                  max={wallet.availableBalance}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 text-sm font-bold mb-2">Provider Code</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={accountBank}
                  onChange={(e) => setAccountBank(e.target.value)}
                >
                  <option value="">Select Provider</option>
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="AIRTEL">Airtel Money</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-600 text-sm font-bold mb-2">Account/Phone Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g. 0770000000"
                />
              </div>
              <button
                type="submit"
                disabled={processing || wallet.availableBalance <= 0}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                Request Withdrawal
              </button>
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
                        tx.type === 'wallet_topup' ? 'bg-blue-100' :
                        tx.type.includes('withdrawal') ? 'bg-amber-100' : 
                        tx.type === 'refund' ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{tx.description}</p>
                        <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`font-bold ${
                        tx.type.includes('withdrawal') ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {tx.type.includes('withdrawal') ? '-' : '+'}UGX {tx.amount.toLocaleString()}
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
    </div>
  );
};

export default WalletScreen;
