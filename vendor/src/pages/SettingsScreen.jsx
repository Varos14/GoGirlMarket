import React, { useState, useEffect } from 'react';
import { Store, User, Lock, Save } from 'lucide-react';
import axios from 'axios';

const SettingsScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  // Payout fields
  const [bankCode, setBankCode] = useState('MTN');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const vendorInfoStr = localStorage.getItem('vendorInfo');
    if (vendorInfoStr) {
      const vendorInfo = JSON.parse(vendorInfoStr);
      setName(vendorInfo.name || '');
      setEmail(vendorInfo.email || '');
      setStoreName(vendorInfo.storeName || '');
      setTagline(vendorInfo.tagline || '');
      setPhone(vendorInfo.phone || '');
      setLocationStr(vendorInfo.location || '');
      setStoreSlug(vendorInfo.storeSlug || '');
      if (vendorInfo.payout) {
        setBankCode(vendorInfo.payout.bankCode || 'MTN');
        setAccountNumber(vendorInfo.payout.accountNumber || '');
        setAccountName(vendorInfo.payout.accountName || '');
      }
    }
  }, []);

  const getStoreUrl = (slug) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:5173/store/${slug}`;
    }
    return `https://go-girl-market-client.vercel.app/store/${slug}`;
  };

  const copyStoreLink = () => {
    if (storeSlug) {
      navigator.clipboard.writeText(getStoreUrl(storeSlug));
      setSuccess('Store link copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const vendorInfo = JSON.parse(localStorage.getItem('vendorInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendorInfo.token}`,
        },
      };

      const { data } = await axios.put(
        '/api/auth/profile',
        {
          name, email, storeName, tagline, phone, location: locationStr, password,
          payout: { bankCode, accountNumber, accountName }
        },
        config
      );

      // Update local storage
      localStorage.setItem('vendorInfo', JSON.stringify(data));
      setStoreSlug(data.storeSlug || '');
      setSuccess('Profile Updated Successfully');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);

      // Force app re-render to update header
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-textPrimary">Store Settings</h1>
        <p className="text-gray-500 mt-2">Manage your vendor profile and store information.</p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="h-16 w-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md uppercase">
            {name ? name.substring(0, 2) : 'VN'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{storeName || 'Your Store'}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <div className="p-8">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{error}</div>}
          {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium">{success}</div>}

          <form onSubmit={submitHandler} className="space-y-8">
            {/* Store Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Store size={20} className="text-primary" />
                Store Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Store Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Security */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-primary" />
                Security
              </h3>
              <p className="text-sm text-gray-500 mb-4">Leave password fields blank if you do not wish to change your password.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-800"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2"
              >
                {loading ? 'Saving...' : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
