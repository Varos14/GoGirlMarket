import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { savePaymentMethod } from '../store/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';

const PaymentScreen = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  if (!shippingAddress.address) {
    navigate('/shipping');
  }

  const [paymentMethod, setPaymentMethod] = useState('Pesapal');
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate('/placeorder');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <CheckoutSteps step1 step2 step3 />
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-heading font-bold mb-6">Payment Method</h1>
        <form onSubmit={submitHandler}>
          <div className="space-y-4 mb-8">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-primary bg-emerald-50/20">
              <input
                type="radio"
                name="paymentMethod"
                value="Pesapal"
                checked={paymentMethod === 'Pesapal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-5 h-5 text-primary"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900">Pesapal (Mobile Money & Cards)</span>
                <span className="text-xs text-gray-500">Pay via M-Pesa, Airtel Money, MTN Mobile Money, Visa or Mastercard</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="In-App Wallet Balance"
                checked={paymentMethod === 'In-App Wallet Balance'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-5 h-5 text-primary"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900">In-App Wallet Balance</span>
                <span className="text-xs text-gray-500">Pay instantly from your GoGirlMarket store wallet balance</span>
              </div>
            </label>
          </div>
          <button type="submit" className="w-full btn-primary py-3 text-lg">
            Continue to Summary
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentScreen;
