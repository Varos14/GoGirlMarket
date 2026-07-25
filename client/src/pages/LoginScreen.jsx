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
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-borderLight shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl">✨</span>
          <h1 className="text-2xl font-heading font-bold text-primary">Welcome Back</h1>
          <p className="text-xs text-textMuted">Sign in to your GoGirl Market account to continue</p>
        </div>

        {customMessage && (
          <div className="bg-cream text-primary p-3 rounded-2xl text-xs border border-borderLight text-center font-medium">
            {customMessage}
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs border border-red-200 text-center">{error}</div>}
        
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-textMuted">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-borderLight">
          <p className="text-xs text-textMuted">
            Don't have an account?{' '}
            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="font-bold text-accent hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
