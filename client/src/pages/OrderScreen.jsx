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
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
        <p className="text-xs text-emerald-800">
          <strong>Note:</strong> Clicking "Pay Now" will open the secure Pesapal checkout where you can pay via MTN Mobile Money, Airtel Money, or Card.
        </p>
      </div>

      <button 
        onClick={handlePayment}
        disabled={processing}
        className="w-full btn-primary py-4 text-xs font-semibold flex justify-center items-center shadow-md hover:shadow-lg transition-colors"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
        ) : (
          `Pay UGX ${amount?.toLocaleString()} with Pesapal`
        )}
      </button>
    </div>
  );
};



const PesapalCheckout = ({ orderId, amount, onSuccess }) => {
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

  const handleSimulatePayment = async () => {
    try {
      setProcessing(true);
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      await axios.put(`/api/orders/${orderId}/pay`, {
        id: 'PESAPAL_' + Math.random().toString(36).substring(2, 9),
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        email_address: userInfo?.email,
      }, config);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
        <p className="text-xs text-emerald-800">
          <strong>Pesapal Payment:</strong> Click below to pay with MTN/Airtel Money or simulate test payment.
        </p>
      </div>

      <button 
        onClick={handlePesapalPayment}
        disabled={processing}
        className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white font-bold py-3.5 rounded-xl flex justify-center items-center shadow-sm text-xs transition-colors"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
        ) : (
          `Pay UGX ${amount?.toLocaleString()} with Pesapal`
        )}
      </button>

      <button 
        onClick={handleSimulatePayment}
        disabled={processing}
        className="w-full btn-secondary py-2.5 text-[11px] font-bold border border-borderLight text-primary hover:bg-cream transition-colors"
      >
        ⚡ Simulate Successful Payment (For Testing)
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
                {order.vendorOrders.map((vendorOrder, vIndex) => {
                  const vendorInfo = vendorOrder.vendor;
                  const storeTitle = vendorInfo?.storeName || vendorInfo?.name || `Vendor Store ${vIndex + 1}`;
                  let rawPhone = vendorInfo?.phone || '';
                  let vendorPhone = rawPhone.replace(/[^\d]/g, '');
                  if (vendorPhone.startsWith('0')) {
                    vendorPhone = '256' + vendorPhone.substring(1);
                  }
                  
                  // Construct WhatsApp pre-filled message
                  const itemsList = vendorOrder.items?.map(i => `${i.qty}x ${i.name}`).join(', ');
                  const customerName = order.user?.name || 'Customer';
                  const addressStr = order.shippingAddress?.address ? `${order.shippingAddress.address}, ${order.shippingAddress.city || ''}` : 'My registered address';
                  const waMessage = encodeURIComponent(
                    `Hello ${storeTitle}! My name is ${customerName}. I have paid for Order #${order._id.substring(18)} (${itemsList}). Delivery Address: ${addressStr}. I would like to confirm delivery arrangements & fee.`
                  );
                  const whatsappUrl = vendorPhone 
                    ? `https://wa.me/${vendorPhone}?text=${waMessage}` 
                    : `https://wa.me/?text=${waMessage}`;

                  return (
                    <div key={vIndex} className="border border-borderLight rounded-2xl p-5 bg-cream/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-borderLight pb-3">
                        <div>
                          <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                            Package {vIndex + 1}: <span className="text-accent">{storeTitle}</span>
                          </h3>
                          <p className="text-[11px] text-textMuted mt-0.5">Delivery fee negotiated & paid directly to seller</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {vendorOrder.disputeStatus === 'Open' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 animate-pulse">
                              ⚠️ Dispute Pending Admin Review
                            </span>
                          ) : vendorOrder.disputeStatus === 'Resolved_Refunded' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200">
                              💸 Refund Approved
                            </span>
                          ) : vendorOrder.isDelivered ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200">
                              Delivered on {vendorOrder.deliveredAt?.substring(0, 10)}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200">
                              Processing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp Delivery Action & Dispute Banner */}
                      {order.isPaid && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                              💬 Discuss Delivery with {storeTitle}
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              Payment for items received! Chat on WhatsApp to fix delivery location & delivery fee.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 justify-center"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.223-1.107zm12.015-6.852c-.12-.2-.437-.32-.917-.56-.48-.24-2.837-1.401-3.276-1.56-.439-.16-.759-.24-1.079.24-.32.48-1.239 1.56-1.519 1.88-.28.32-.56.36-1.04.12-.48-.24-2.029-.748-3.864-2.384-1.429-1.274-2.394-2.848-2.674-3.328-.28-.48-.03-.739.21-.978.216-.215.48-.56.72-.84.24-.28.32-.48.48-.8.16-.32.08-.6-.04-.84-.12-.24-1.079-2.599-1.479-3.559-.39-.935-.789-.808-1.079-.823-.27-.014-.58-.014-.89-.014-.31 0-.82.12-1.25.59-.43.47-1.65 1.61-1.65 3.93 0 2.32 1.69 4.56 1.93 4.88.24.32 3.32 5.07 8.05 7.12 1.12.49 2 .78 2.68.99 1.13.36 2.16.31 2.97.19.91-.13 2.83-1.16 3.23-2.28.4-1.12.4-2.08.28-2.28z"/>
                              </svg>
                              Chat on WhatsApp
                            </a>
                            {vendorOrder.disputeStatus !== 'Open' && vendorOrder.disputeStatus !== 'Resolved_Refunded' && (
                              <button
                                onClick={async () => {
                                  const reason = prompt('State the issue with this package (e.g. Item not received / Damaged item):');
                                  if (reason) {
                                    try {
                                      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
                                      await axios.post(`/api/orders/${order._id}/dispute`, { vendorId: vendorInfo?._id || vendorOrder.vendor, reason }, config);
                                      dispatch(getOrderDetails(order._id));
                                    } catch (err) {
                                      alert(err.response?.data?.message || 'Failed to submit dispute');
                                    }
                                  }
                                }}
                                className="btn-secondary text-[10px] py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50"
                              >
                                Claim Refund
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <ul className="divide-y divide-borderLight bg-surface rounded-xl shadow-xs px-4">
                        {vendorOrder.items?.map((item, index) => (
                          <li key={index} className="py-3 flex gap-4 items-center">
                            <div className="w-14 h-14 bg-background rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-borderLight">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-textMuted">Image</span>
                              )}
                            </div>
                            <Link to={`/product/${item.product}`} className="flex-grow font-bold text-primary text-xs hover:text-accent transition-colors">
                              {item.name}
                            </Link>
                            <div className="font-bold text-primary text-xs whitespace-nowrap">
                              {item.qty} x UGX {item.price?.toLocaleString()} = UGX {(item.qty * item.price)?.toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
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
                <PesapalCheckout 
                  orderId={orderId} 
                  amount={order.totalPrice} 
                  onSuccess={() => dispatch(getOrderDetails(orderId))} 
                />
              </div>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderScreen;
