import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveShippingAddress } from '../store/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';

const ShippingScreen = () => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || 'Uganda');
  const [phone, setPhone] = useState(shippingAddress.phone || '');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const { userInfo } = auth;

  // Protect route
  if (!userInfo) {
    navigate('/login?redirect=shipping');
  }

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress({ address, city, postalCode, country, phone }));
    navigate('/payment');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <CheckoutSteps step1 step2 />
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading font-bold mb-2">Home Delivery Details</h1>
        <p className="text-gray-500 mb-6">Please enter your delivery address and contact info.</p>
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Street Address</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kampala Road, Plot 12"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">City/District</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kampala"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Postal Code (Optional)</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Country</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +256700000000"
            />
          </div>
          <button type="submit" className="w-full btn-primary py-3 text-lg mt-4">
            Continue to Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShippingScreen;
