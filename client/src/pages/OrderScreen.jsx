import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, payOrder, orderPayReset } from '../store/orderSlice';
import axios from 'axios';

// Stripe
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    // In a real app, you would hit your backend to create a PaymentIntent and get the client_secret
    // For this MVP, we simulate success immediately using Stripe test mode methodology
    
    // Simulate API delay
    setTimeout(() => {
      const mockPaymentResult = {
        id: 'mock_stripe_id_' + Math.random().toString(36).substr(2, 9),
        status: 'succeeded',
        update_time: new Date().toISOString(),
        payer: { email_address: 'test@example.com' },
      };
      
      onSuccess(mockPaymentResult);
      setProcessing(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="p-4 border rounded-md bg-white">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full btn-primary py-3 flex justify-center items-center"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
          `Pay UGX ${amount.toLocaleString()}`
        )}
      </button>
    </form>
  );
};

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const dispatch = useDispatch();

  const [stripePromise, setStripePromise] = useState(null);

  const orderState = useSelector((state) => state.order);
  const { order, loading, error, successPay, loadingPay } = orderState;

  useEffect(() => {
    const fetchStripeKey = async () => {
      const { data } = await axios.get('/api/config/stripe');
      setStripePromise(loadStripe(data));
    };
    fetchStripeKey();
  }, []);

  useEffect(() => {
    if (!order || order._id !== orderId || successPay) {
      dispatch(orderPayReset());
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, orderId, order, successPay]);

  const handlePaymentSuccess = (paymentResult) => {
    dispatch(payOrder({ orderId, paymentResult }));
  };

  return loading || !order ? (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ) : error ? (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>
    </div>
  ) : (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 text-textPrimary">Order {order._id}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Order Details */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Shipping</h2>
            <p className="text-gray-700 mb-4">
              <span className="font-bold">Name: </span> {order.user.name} <br />
              <span className="font-bold">Email: </span> <a href={`mailto:${order.user.email}`} className="text-primary hover:underline">{order.user.email}</a> <br />
              <span className="font-bold">Address: </span>
              {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </p>
            {order.isDelivered ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                Delivered on {order.deliveredAt.substring(0, 10)}
              </div>
            ) : (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-sm">
                Not Delivered
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Payment Method</h2>
            <p className="text-gray-700 mb-4">
              <span className="font-bold">Method: </span>
              {order.paymentMethod}
            </p>
            {order.isPaid ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                Paid on {order.paidAt.substring(0, 10)}
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                Not Paid
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Order Items</h2>
            <ul className="divide-y divide-gray-100">
              {order.orderItems.map((item, index) => (
                <li key={index} className="py-4 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-surface rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Image</span>
                    )}
                  </div>
                  <Link to={`/product/${item.product}`} className="flex-grow font-semibold hover:text-primary">
                    {item.name}
                  </Link>
                  <div className="font-bold text-gray-700 whitespace-nowrap">
                    {item.qty} x UGX {item.price.toLocaleString()} = UGX {(item.qty * item.price).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Order Summary & Payment */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-heading font-bold mb-6 border-b pb-2">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-semibold">UGX {order.itemsPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">UGX {order.shippingPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">UGX {order.taxPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">UGX {order.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {!order.isPaid && stripePromise && (
              <div className="mt-8 border-t pt-6">
                <h3 className="font-bold text-gray-700 mb-4">Pay with Card</h3>
                <Elements stripe={stripePromise}>
                  <CheckoutForm orderId={orderId} amount={order.totalPrice} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderScreen;
