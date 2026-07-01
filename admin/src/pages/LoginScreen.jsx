import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      if (data.role !== 'admin') {
        setError('Access denied. You must be an admin.');
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = '/'; // hard refresh to update state
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGirl Market" className="h-12 w-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading">Admin Portal Login</h2>
          <p className="text-gray-500 text-sm mt-2">Sign in with your Super Admin credentials</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold mb-6 text-center">{error}</div>}

        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Email</label>
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
          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
