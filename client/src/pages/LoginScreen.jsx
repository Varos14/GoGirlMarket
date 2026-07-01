import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const auth = useSelector((state) => state.auth);
  const { loading, error, userInfo } = auth;

  const redirect = location.search ? location.search.split('=')[1] : '/';
  const customMessage = location.state?.message;

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-3xl font-heading font-bold mb-6 text-center text-textPrimary">Welcome Back</h1>
      
      {customMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 shadow-sm text-sm font-medium text-center flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {customMessage}
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
      
      <form onSubmit={submitHandler} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
          <input
            type="email"
            required
            className="w-full p-3 border rounded-md outline-none focus:border-primary transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-semibold">Password</label>
            <Link 
              to="/forgot-password"
              className="text-sm font-bold text-primary hover:text-secondary transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            required
            className="w-full p-3 border rounded-md outline-none focus:border-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          New Customer?{' '}
          <Link 
            to={redirect ? `/register?redirect=${redirect}` : '/register'} 
            state={{ message: customMessage }}
            className="text-primary font-bold hover:underline"
          >
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
