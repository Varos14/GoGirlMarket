import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await axios.post('/api/auth/forgotpassword', { email });
      setMessage(data.message || 'Email sent successfully. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GoGirl Market" className="h-12 w-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-2">Enter your email to receive a password reset link.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm font-semibold mb-6 text-center">{error}</div>}
        
        {message ? (
          <div className="text-center">
            <div className="flex justify-center mb-4 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg text-sm font-semibold mb-6">
              {message}
            </div>
            <Link to="/" className="inline-block mt-4 text-primary hover:text-pink-600 font-bold text-sm transition-colors">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center h-12"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="text-center mt-6">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
