import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, payOrder, orderPayReset } from '../store/orderSlice';
import axios from 'axios';

const FlutterwaveCheckout = ({ orderId, amount, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);
  const { userInfo } = auth || {};

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      // 1. Hit our backend to generate the Flutterwave link with split payload
      const { data } = await axios.post(`/api/orders/${orderId}/flutterwave`, {}, config);

      console.log("Flutterwave Split Response:", data);

      // 2. In a real app, we would redirect the user to data.payment_url here
      // window.location.href = data.payment_url;
      
      // Since this is a mock, we simulate a successful payment popup and callback
      setTimeout(() => {
        const mockPaymentResult = {
          id: 'FLW_' + Math.random().toString(36).substr(2, 9),
          status: 'successful',
          update_time: new Date().toISOString(),
          email_address: userInfo?.email,
        };
        
        onSuccess(mockPaymentResult);
        setProcessing(false);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-orange-800">
          <strong>Note:</strong> Clicking "Pay Now" will open the secure Flutterwave checkout where you can pay via MTN Mobile Money, Airtel Money, or Card.
        </p>
      </div>

      <button 
        onClick={handlePayment}
        disabled={processing}
        className="w-full bg-[#f5a623] hover:bg-[#e09612] text-white font-bold py-4 rounded-xl flex justify-center items-center shadow-lg transition-colors"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
          `Pay UGX ${amount?.toLocaleString()} with Flutterwave`
        )}
      </button>
    </div>
  );
};



const PesapalCheckout = ({ orderId, amount }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);
  const { userInfo } = auth || {};

  const handlePesapalPayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data } = await axios.post(`/api/orders/${orderId}/pesapal`, {}, config);

      if (data.redirect_url) {
        // Redirect to Pesapal's secure checkout page
        window.location.href = data.redirect_url;
      } else {
        setError('Failed to obtain Pesapal payment link.');
        setProcessing(false);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-emerald-800">
          <strong>Pesapal Hosted Payment:</strong> You will be redirected to Pesapal's secure gateway to complete payment using M-Pesa, Airtel Money, MTN Money, or Credit/Debit Card.
        </p>
      </div>

      <button 
        onClick={handlePesapalPayment}
        disabled={processing}
        className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white font-bold py-4 rounded-xl flex justify-center items-center shadow-lg transition-colors"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
          `Pay UGX ${amount?.toLocaleString()} with Pesapal`
        )}
      </button>
    </div>
  );
};

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const dispatch = useDispatch();

  const orderState = useSelector((state) => state.order);
  const { order, loading, error, successPay } = orderState;
  const { userInfo } = useSelector((state) => state.auth);

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!order || order._id !== orderId || successPay) {
      dispatch(orderPayReset());
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, orderId, order, successPay]);

  const handlePaymentSuccess = (paymentResult) => {
    dispatch(payOrder({ orderId, paymentResult }));
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setCancelError('');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      await axios.put(`/api/orders/${orderId}/cancel`, { reason: cancelReason }, config);
      setCancelling(false);
      setShowCancelModal(false);
      dispatch(getOrderDetails(orderId));
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message);
      setCancelling(false);
    }
  };

  const stages = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentStageIndex = order ? stages.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'Cancelled';
  const canCancel = order && !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-textPrimary">Order #{order._id}</h1>
          <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.deliveryType || 'Standard'} Delivery</p>
        </div>
        
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 border border-red-500 text-red-600 hover:bg-red-50 font-semibold rounded-lg text-sm transition-colors self-start md:self-auto"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Cancel Order #{order._id}?</h3>
            <p className="text-sm text-gray-600">Are you sure you want to cancel this order? Items will be released back into inventory.</p>
            
            {cancelError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs border border-red-200 rounded-lg">{cancelError}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for cancellation (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind / Ordered by mistake"
                className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Jumia-style Visual Order Tracking Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Package Tracking Timeline
          {isCancelled && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">CANCELLED</span>}
        </h2>
        
        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <strong>This order was cancelled.</strong> {order.cancellationReason && `Reason: ${order.cancellationReason}`}
          </div>
        ) : (
          <div className="relative">
            {/* Progress Bar Line */}
            <div className="hidden md:block overflow-hidden h-2 mb-6 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 100)}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
              ></div>
            </div>

            {/* Stepper Nodes */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              {stages.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                let timestamp = null;

                if (stage === 'Pending') timestamp = order.createdAt;
                if (stage === 'Confirmed') timestamp = order.confirmedAt;
                if (stage === 'Processing') timestamp = order.processingAt;
                if (stage === 'Shipped') timestamp = order.shippedAt;
                if (stage === 'Out for Delivery') timestamp = order.outForDeliveryAt;
                if (stage === 'Delivered') timestamp = order.deliveredAt;

                return (
                  <div key={stage} className={`flex flex-col items-center p-3 rounded-lg ${isCurrent ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                      isPassed ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs font-bold ${isPassed ? 'text-primary' : 'text-gray-400'}`}>
                      {stage}
                    </span>
                    {timestamp && (
                      <span className="text-[10px] text-gray-500 mt-1">
                        {new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Order Details */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Home Delivery Details</h2>
            <p className="text-gray-700 mb-4">
              <span className="font-bold">Name: </span> {order.user?.name} <br />
              <span className="font-bold">Email: </span> <a href={`mailto:${order.user?.email}`} className="text-primary hover:underline">{order.user?.email}</a> <br />
              {order.shippingAddress?.phone && <><span className="font-bold">Phone: </span> {order.shippingAddress?.phone} <br /></>}
              <span className="font-bold">Address: </span>
              {order.shippingAddress?.address}, {order.shippingAddress?.city},{' '}
              {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Payment Method</h2>
            <p className="text-gray-700 mb-4">
              <span className="font-bold">Method: </span>
              {order.paymentMethod}
            </p>
            {order.paymentMethod === 'In-App Wallet Balance' ? (
               <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded text-sm">
                Paid from Wallet
              </div>
            ) : order.isPaid ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                Paid on {order.paidAt?.substring(0, 10)}
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                Not Paid
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Order Items & Delivery Status</h2>
            {order.vendorOrders && order.vendorOrders.length > 0 ? (
              <div className="space-y-6">
                {order.vendorOrders.map((vendorOrder, vIndex) => (
                  <div key={vIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                      <h3 className="font-bold text-gray-800">Package {vIndex + 1} <span className="text-sm font-normal text-blue-600">(Shipping: Paid on Delivery)</span></h3>
                      {vendorOrder.isDelivered ? (
                        <span className="bg-green-100 border border-green-400 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                          Delivered on {vendorOrder.deliveredAt?.substring(0, 10)}
                        </span>
                      ) : (
                        <span className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                          Processing
                        </span>
                      )}
                    </div>
                    <ul className="divide-y divide-gray-200 bg-white rounded shadow-sm px-4">
                      {vendorOrder.items?.map((item, index) => (
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
                            {item.qty} x UGX {item.price?.toLocaleString()} = UGX {(item.qty * item.price)?.toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {order.orderItems?.map((item, index) => (
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
                      {item.qty} x UGX {item.price?.toLocaleString()} = UGX {(item.qty * item.price)?.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Side: Order Summary & Payment */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-heading font-bold mb-6 border-b pb-2">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-semibold">UGX {order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Paid on Delivery</span>
              </div>

              <div className="flex justify-between border-t pt-4 text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">UGX {order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            {!order.isPaid && order.paymentMethod !== 'In-App Wallet Balance' && (
              <div className="mt-8 border-t pt-6">
                <h3 className="font-bold text-gray-700 mb-4">Complete Payment</h3>
                <PesapalCheckout orderId={orderId} amount={order.totalPrice} />
              </div>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderScreen;
