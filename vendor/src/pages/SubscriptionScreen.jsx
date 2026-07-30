import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Check, Shield, Zap } from 'lucide-react';

const SubscriptionScreen = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if coming back from Pesapal success
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('success')) {
      alert('Payment initiated! Your subscription status will update shortly once the transaction clears.');
      // Clean up URL
      navigate('/subscription', { replace: true });
    }
    fetchSubscription();
  }, [location]);

  const fetchSubscription = async () => {
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      if (!vendorInfoStr) return;
      const vendorInfo = JSON.parse(vendorInfoStr);
      
      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      const { data } = await axios.get('/api/subscriptions/my-subscription', config);
      setSubscription(data.subscription);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch subscription', error);
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    if (!window.confirm(`Are you sure you want to upgrade to the ${plan} plan via Pesapal?`)) return;
    setUpdating(true);
    try {
      const vendorInfoStr = localStorage.getItem('vendorInfo');
      const vendorInfo = JSON.parse(vendorInfoStr);
      
      const config = {
        headers: { Authorization: `Bearer ${vendorInfo.token}` },
      };

      const callbackUrl = window.location.origin + '/subscription?success=true';

      const { data } = await axios.post('/api/subscriptions/pay-pro', { callbackUrl }, config);
      
      if (data.redirect_url) {
        // Redirect to Pesapal Checkout
        window.location.href = data.redirect_url;
      } else {
        alert('Failed to get payment link');
        setUpdating(false);
      }
    } catch (error) {
      console.error('Failed to initiate payment', error);
      alert('Error connecting to payment gateway.');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const status = subscription?.status || 'trial';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary">Subscription Plan</h1>
        <p className="text-sm text-textMuted mt-1">Manage your vendor subscription to unlock premium platform features.</p>
      </div>

      {/* Current Plan Overview */}
      <div className="bg-gradient-to-br from-primary to-[#2a1b38] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield size={120} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-6">
            <Zap size={14} className="text-accent" />
            Current Status: <span className="uppercase font-bold tracking-wider">{status}</span>
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2 capitalize">{currentPlan} Plan</h2>
          <p className="text-white/70 max-w-md text-sm mb-6">
            {currentPlan === 'free' 
              ? 'You are on the standard commission-based plan. Upgrade to reduce your commission rates and unlock analytics.' 
              : 'You have unlocked premium features! Keep selling and growing your brand.'}
          </p>
          {subscription?.expiresAt && (
             <p className="text-xs text-white/50">Renews on: {new Date(subscription.expiresAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Free Plan */}
        <div className={`vendor-card p-6 border-2 transition-all ${currentPlan === 'free' ? 'border-accent shadow-lg shadow-accent/10' : 'border-transparent opacity-80'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-heading font-bold text-primary">Free Tier</h3>
              <p className="text-sm text-textMuted">Pay as you go</p>
            </div>
            {currentPlan === 'free' && <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded-lg">Current</span>}
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-primary">UGX 0</span>
            <span className="text-textMuted text-sm"> / month</span>
          </div>
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 10% Platform Commission</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Standard Support</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Unlimited Products</li>
          </ul>
          <button 
            disabled={currentPlan === 'free'} 
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${currentPlan === 'free' ? 'bg-background text-textMuted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
            {currentPlan === 'free' ? 'Active' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`vendor-card p-6 border-2 transition-all ${currentPlan === 'pro' ? 'border-accent shadow-lg shadow-accent/10' : 'border-transparent'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-heading font-bold text-primary">Pro Tier</h3>
              <p className="text-sm text-textMuted">For growing businesses</p>
            </div>
            {currentPlan === 'pro' && <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded-lg">Current</span>}
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-primary">UGX 50,000</span>
            <span className="text-textMuted text-sm"> / month</span>
          </div>
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 5% Platform Commission</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Priority Support</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Advanced Analytics</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Promoted Listing Credits (UGX 10k/mo)</li>
          </ul>
          <button 
            onClick={() => handleUpgrade('pro')}
            disabled={currentPlan === 'pro' || updating} 
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${currentPlan === 'pro' ? 'bg-background text-textMuted cursor-not-allowed' : 'bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20'}`}
          >
            {updating ? 'Processing...' : currentPlan === 'pro' ? 'Active' : (
              <>
                <CreditCard size={18} />
                Upgrade to Pro
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionScreen;
