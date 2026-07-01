import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { token } = useParams();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await axios.put(`/api/auth/resetpassword/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 text-textPrimary">Set New Password</h1>
        <p className="text-gray-500 text-sm">Create a new, secure password for your account.</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center text-sm" role="alert">{error}</div>}
      
      {success ? (
        <div className="text-center">
          <div className="flex justify-center mb-4 text-green-500">
            <CheckCircle2 size={48} />
          </div>
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg text-sm font-semibold mb-6">
            Your password has been successfully reset!
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary py-3 text-lg flex justify-center items-center gap-2"
          >
            Continue to Login <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">New Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border rounded-md outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
              'Save Password'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordScreen;
