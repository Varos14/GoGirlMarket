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
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 text-textPrimary">Reset Password</h1>
        <p className="text-gray-500 text-sm">Enter your email to receive a password reset link.</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center text-sm" role="alert">{error}</div>}
      
      {message ? (
        <div className="text-center">
          <div className="flex justify-center mb-4 text-green-500">
            <CheckCircle2 size={48} />
          </div>
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg text-sm font-semibold mb-6">
            {message}
          </div>
          <Link to="/login" className="inline-block mt-4 text-primary hover:text-secondary font-bold transition-colors">
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border rounded-md outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full btn-primary py-3 text-lg flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordScreen;
