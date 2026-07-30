import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../store/authSlice';
import { listMyOrders } from '../store/orderSlice';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const { userInfo, loading: loadingAuth, error: errorAuth } = auth;

  const orderState = useSelector((state) => state.order);
  const { orders, loading: loadingOrders, error: errorOrders } = orderState;

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      setName(userInfo.name);
      setEmail(userInfo.email);
      dispatch(listMyOrders());
    }
  }, [dispatch, navigate, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
    } else {
      dispatch(updateUserProfile({ id: userInfo._id, name, email, password }));
      setMessage('Profile Updated Successfully');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-borderLight flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <div className="w-20 h-20 rounded-full bg-cream text-primary border-2 border-borderLight flex items-center justify-center font-bold text-2xl shadow-xs">
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-heading font-bold text-primary">{name || 'Customer Account'}</h1>
          <p className="text-xs text-textMuted">{email}</p>
          <span className="pill-badge bg-softRose text-accent text-[10px] uppercase font-bold tracking-wider">GoGirl Member</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Form */}
        <div className="bg-surface p-6 rounded-3xl border border-borderLight shadow-xs h-fit space-y-4">
          <div className="flex justify-between items-center border-b border-borderLight pb-3">
            <h2 className="text-lg font-heading font-bold text-primary">Account Details</h2>
            <Link to="/wallet" className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors">
              💳 My Wallet
            </Link>
          </div>
          {message && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs border border-emerald-200">{message}</div>}
          {errorAuth && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">{errorAuth}</div>}
          
          <form onSubmit={submitHandler} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Full Name</label>
              <input
                type="text"
                className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Email Address</label>
              <input
                type="email"
                className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">New Password</label>
              <input
                type="password"
                className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                placeholder="Leave blank to keep current"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full bg-background border border-borderLight text-xs p-3 rounded-xl outline-none focus:border-accent"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="w-full btn-primary py-3 text-xs shadow-xs" disabled={loadingAuth}>
              {loadingAuth ? 'Updating...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-3xl border border-borderLight shadow-xs space-y-4">
          <h2 className="text-lg font-heading font-bold text-primary border-b border-borderLight pb-3">My Orders</h2>
          
          {loadingOrders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : errorOrders ? (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">{errorOrders}</div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-background p-8 rounded-2xl text-center space-y-2 border border-borderLight">
              <span className="text-3xl">📦</span>
              <p className="text-xs text-textMuted">You have not placed any orders yet.</p>
              <Link to="/shop" className="btn-secondary py-2 px-5 text-xs inline-block mt-2">
                Start Browsing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-background p-4 rounded-2xl border border-borderLight flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-xs font-bold text-primary">Order #{order._id.substring(0, 10)}</p>
                    <p className="text-[11px] text-textMuted">{order.createdAt.substring(0, 10)} • UGX {order.totalPrice?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {order.isPaid ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Paid</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Pending</span>
                    )}
                    <Link to={`/order/${order._id}`} className="btn-secondary py-1.5 px-3 text-xs">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ProfileScreen;
