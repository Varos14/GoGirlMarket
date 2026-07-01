import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      if (data.role !== 'vendor' && data.role !== 'admin') {
        setError('Access denied. You must be a verified vendor to access this portal.');
        return;
      }

      localStorage.setItem('vendorInfo', JSON.stringify(data));
      window.location.href = '/'; 
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGirl Market" className="h-12 w-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading">Vendor Portal</h2>
          <p className="text-gray-500 text-sm mt-2">Sign in to manage your store and products.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold mb-6 text-center">{error}</div>}

        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <Link 
                to="/forgot-password"
                className="text-xs font-bold text-primary hover:text-pink-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-colors shadow-md">
            Enter Dashboard
          </button>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Want to sell with us? </span>
            <Link to="/register" className="text-primary font-bold hover:underline">
              Apply as a Vendor
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
