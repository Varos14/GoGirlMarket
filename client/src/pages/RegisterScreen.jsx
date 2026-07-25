import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/authSlice';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

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
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      dispatch(register({ name, email, password }));
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-borderLight shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl">🛍️</span>
          <h1 className="text-2xl font-heading font-bold text-primary">Create Account</h1>
          <p className="text-xs text-textMuted">Join GoGirl Market to start shopping fashion & lifestyle</p>
        </div>

        {customMessage && (
          <div className="bg-cream text-primary p-3 rounded-2xl text-xs border border-borderLight text-center font-medium">
            {customMessage}
          </div>
        )}

        {message && <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs border border-red-200 text-center">{message}</div>}
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs border border-red-200 text-center">{error}</div>}
        
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textMuted mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

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
            <label className="block text-xs font-semibold text-textMuted mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-borderLight">
          <p className="text-xs text-textMuted">
            Already have an account?{' '}
            <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="font-bold text-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
