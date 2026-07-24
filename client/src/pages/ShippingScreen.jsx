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
  const [region, setRegion] = useState(shippingAddress.region || 'Central Region');
  const [ward, setWard] = useState(shippingAddress.ward || '');
  const [landmark, setLandmark] = useState(shippingAddress.landmark || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || 'Uganda');
  const [phone, setPhone] = useState(shippingAddress.phone || '');
  const [deliveryType, setDeliveryType] = useState(cart.deliveryType || 'Standard');

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
    dispatch(saveShippingAddress({ address, city, region, ward, landmark, postalCode, country, phone }));
    dispatch({ type: 'cart/saveDeliveryType', payload: deliveryType });
    navigate('/payment');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <CheckoutSteps step1 step2 />
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading font-bold mb-2">Door Delivery Details</h1>
        <p className="text-gray-500 mb-6">Enter your precise door delivery address and contact information.</p>
        
        <form onSubmit={submitHandler} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Region / Zone</label>
              <select
                className="w-full p-3 border rounded-md outline-none focus:border-primary bg-white"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="Central Region">Central Region (Kampala, Wakiso, Mukono)</option>
                <option value="Eastern Region">Eastern Region (Jinja, Mbale, Soroti)</option>
                <option value="Western Region">Western Region (Mbarara, Gulu, Fort Portal)</option>
                <option value="Northern Region">Northern Region (Arua, Lira, Kitgum)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">City / District</label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-md outline-none focus:border-primary"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kampala"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Subcounty / Ward / Division</label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-md outline-none focus:border-primary"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. Nakawa / Bugolobi"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nearest Landmark</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md outline-none focus:border-primary"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Shell Gas Station"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Street Address / House No.</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-md outline-none focus:border-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot 12, Main Street, Apt 4B"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Country</label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-md outline-none focus:border-primary bg-gray-50"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Speed Selector */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-gray-700 font-bold mb-3">Select Delivery Option</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${deliveryType === 'Standard' ? 'border-primary bg-emerald-50/30 ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">Standard Delivery</span>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="Standard"
                      checked={deliveryType === 'Standard'}
                      onChange={(e) => setDeliveryType(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Delivered within 2 - 4 business days</p>
                </div>
                <span className="text-xs font-semibold text-primary mt-3">Paid on Delivery</span>
              </label>

              <label className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${deliveryType === 'Express' ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">Express Delivery 🚀</span>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="Express"
                      checked={deliveryType === 'Express'}
                      onChange={(e) => setDeliveryType(e.target.value)}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Same day / Next day fast dispatch</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 mt-3">Priority Courier</span>
              </label>
            </div>
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
