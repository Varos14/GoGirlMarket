import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { saveShippingAddress, savePaymentMethod, clearCartItems } from '../store/cartSlice';
import { createOrder, orderCreateReset } from '../store/orderSlice';
import { ShieldCheck } from 'lucide-react';
import axios from 'axios';

const CheckoutScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const cart = useSelector((state) => state.cart);
  const { shippingAddress, cartItems } = cart;
  
  const auth = useSelector((state) => state.auth);
  const { userInfo } = auth;

  const orderCreate = useSelector((state) => state.order);
  const { order, success, error, loading } = orderCreate;

  // Protect route
  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=checkout');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [userInfo, cartItems, navigate]);

  // Shipping State
  const [address, setAddress] = useState(shippingAddress?.address || '');
  const [city, setCity] = useState(shippingAddress?.city || '');
  const [region, setRegion] = useState(shippingAddress?.region || 'Central Region');
  const [ward, setWard] = useState(shippingAddress?.ward || '');
  const [landmark, setLandmark] = useState(shippingAddress?.landmark || '');
  const [postalCode, setPostalCode] = useState(shippingAddress?.postalCode || '');
  const [country, setCountry] = useState(shippingAddress?.country || 'Uganda');
  const [phone, setPhone] = useState(shippingAddress?.phone || '');
  const [deliveryType, setDeliveryType] = useState(cart?.deliveryType || 'Standard');

  // Payment State
  const [paymentMethod, setPaymentMethodState] = useState(cart?.paymentMethod || 'Pesapal');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Calculations
  const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(0);

  const itemsPrice = addDecimals(
    cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );

  const discountDetails = (cart.appliedCoupons || []).map(coupon => {
    const vendorItems = cartItems.filter(item => item.vendor === coupon.vendor);
    let eligibleItems = vendorItems;
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      eligibleItems = vendorItems.filter(item => coupon.applicableProducts.includes(item.product));
    }
    const eligibleSubtotal = eligibleItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = eligibleSubtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(Math.round(discount), eligibleSubtotal);

    return {
      ...coupon,
      eligibleCount: eligibleItems.length,
      totalVendorItems: vendorItems.length,
      isScoped: coupon.applicableProducts && coupon.applicableProducts.length > 0,
      discount
    };
  });

  const totalDiscount = discountDetails.reduce((total, d) => total + d.discount, 0);
  const itemsPriceAfterDiscount = itemsPrice - totalDiscount;
  const shippingPrice = 0;
  const taxPrice = 0;
  const totalPrice = (Number(itemsPriceAfterDiscount) + Number(shippingPrice) + Number(taxPrice)).toFixed(0);

  // Place Order Effect
  useEffect(() => {
    if (success) {
      dispatch(clearCartItems());
      dispatch(orderCreateReset());
      navigate(`/order/${order._id}`);
    }
  }, [navigate, success, dispatch, order]);

  const placeOrderHandler = (e) => {
    e.preventDefault();
    
    // Save to Redux First
    dispatch(saveShippingAddress({ address, city, region, ward, landmark, postalCode, country, phone }));
    dispatch({ type: 'cart/saveDeliveryType', payload: deliveryType });
    dispatch(savePaymentMethod(paymentMethod));

    // Create Order
    dispatch(
      createOrder({
        orderItems: cartItems,
        shippingAddress: { address, city, region, ward, landmark, postalCode, country, phone },
        paymentMethod: paymentMethod,
        itemsPrice: itemsPriceAfterDiscount,
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalPrice: totalPrice,
        appliedCoupons: (cart.appliedCoupons || []).map(c => ({
          ...c,
          couponId: c.couponId || c._id
        }))
      })
    );
  };

  const applyCouponHandler = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    
    try {
      const config = { headers: { 'Authorization': `Bearer ${userInfo?.token}` } };
      const { data } = await axios.get(`/api/coupons/validate/${couponCode}`, config);
      
      const vendorItems = cartItems.filter(item => item.vendor === data.vendor);
      if (vendorItems.length === 0) throw new Error('This coupon is not valid for any items in your cart');

      let eligibleItems = vendorItems;
      if (data.applicableProducts && data.applicableProducts.length > 0) {
        eligibleItems = vendorItems.filter(item => data.applicableProducts.includes(item.product));
        if (eligibleItems.length === 0) throw new Error('This coupon is not valid for the products in your cart');
      }

      if (data.minOrderAmount && data.minOrderAmount > 0) {
        const eligibleTotal = eligibleItems.reduce((acc, item) => acc + item.price * item.qty, 0);
        if (eligibleTotal < data.minOrderAmount) {
          throw new Error(`Minimum order of UGX ${data.minOrderAmount.toLocaleString()} required for this coupon`);
        }
      }
      
      dispatch({ type: 'cart/applyCoupon', payload: {
        couponId: data._id, vendor: data.vendor, code: data.code, discountType: data.discountType,
        discountValue: data.discountValue, maxDiscountAmount: data.maxDiscountAmount || 0,
        applicableProducts: data.applicableProducts || []
      }});

      setCouponSuccess(data.applicableProducts?.length > 0 
        ? `${data.code} applied to ${eligibleItems.length} of ${vendorItems.length} item(s)` 
        : `${data.code} applied successfully!`);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.message || err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-heading font-bold mb-8 text-primary">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Forms */}
        <div className="w-full lg:w-2/3 space-y-6">
          <form id="checkout-form" onSubmit={placeOrderHandler} className="space-y-6">
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-heading font-bold mb-4">1. Delivery Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Region / Zone</label>
                    <select className="w-full p-3 border rounded-md outline-none focus:border-primary bg-white" value={region} onChange={(e) => setRegion(e.target.value)}>
                      <option value="Central Region">Central Region</option>
                      <option value="Eastern Region">Eastern Region</option>
                      <option value="Western Region">Western Region</option>
                      <option value="Northern Region">Northern Region</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">City / District</label>
                    <input type="text" required className="w-full p-3 border rounded-md outline-none focus:border-primary" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kampala" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Subcounty / Ward</label>
                    <input type="text" required className="w-full p-3 border rounded-md outline-none focus:border-primary" value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Nakawa" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Nearest Landmark</label>
                    <input type="text" className="w-full p-3 border rounded-md outline-none focus:border-primary" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Street Address / House No.</label>
                  <input type="text" required className="w-full p-3 border rounded-md outline-none focus:border-primary" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 12, Main Street" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                    <input type="text" required className="w-full p-3 border rounded-md outline-none focus:border-primary" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +256700000000" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Country</label>
                    <input type="text" required className="w-full p-3 border rounded-md outline-none focus:border-primary bg-gray-50" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>

                {/* Delivery Type */}
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <label className="block text-gray-700 font-bold mb-3">Delivery Option</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${deliveryType === 'Standard' ? 'border-primary bg-emerald-50/30 ring-2 ring-primary/20' : 'border-gray-200'}`}>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-gray-900">Standard</span>
                          <input type="radio" name="deliveryType" value="Standard" checked={deliveryType === 'Standard'} onChange={(e) => setDeliveryType(e.target.value)} className="text-primary focus:ring-primary" />
                        </div>
                        <p className="text-xs text-gray-500">2 - 4 business days</p>
                      </div>
                    </label>
                    <label className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between transition-all ${deliveryType === 'Express' ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20' : 'border-gray-200'}`}>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-gray-900">Express 🚀</span>
                          <input type="radio" name="deliveryType" value="Express" checked={deliveryType === 'Express'} onChange={(e) => setDeliveryType(e.target.value)} className="text-amber-500 focus:ring-amber-500" />
                        </div>
                        <p className="text-xs text-gray-500">Same day / Next day</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-heading font-bold mb-4">2. Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-primary bg-emerald-50/20">
                  <input type="radio" name="paymentMethod" value="Pesapal" checked={paymentMethod === 'Pesapal'} onChange={(e) => setPaymentMethodState(e.target.value)} className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-gray-900">Pesapal (Mobile Money & Cards)</span>
                    <span className="text-xs text-gray-500">Pay via M-Pesa, Airtel Money, MTN Mobile Money, Visa or Mastercard</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="paymentMethod" value="In-App Wallet Balance" checked={paymentMethod === 'In-App Wallet Balance'} onChange={(e) => setPaymentMethodState(e.target.value)} className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-gray-900">In-App Wallet Balance</span>
                    <span className="text-xs text-gray-500">Pay instantly from your GoGirlMarket store wallet balance</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-heading font-bold mb-4 border-b pb-2">3. Review Items</h2>
              <ul className="divide-y divide-gray-100">
                {cartItems.map((item, index) => (
                  <li key={index} className="py-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-surface rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Image</span>}
                    </div>
                    <Link to={`/product/${item.product}`} className="flex-grow font-semibold hover:text-primary">{item.name}</Link>
                    <div className="font-bold text-gray-700 whitespace-nowrap">
                      {item.qty} x UGX {item.price.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-heading font-bold mb-6 border-b pb-2">Order Summary</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Subtotal</span>
                <span className="font-semibold">UGX {Number(itemsPrice).toLocaleString()}</span>
              </div>
              
              {discountDetails.length > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount</span>
                  <span>- UGX {Number(totalDiscount).toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Shipping</span>
                <span className="font-medium text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded">Paid on Delivery</span>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">UGX {Number(totalPrice).toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" form="checkout-form" className="w-full btn-primary py-3 text-lg flex justify-center items-center mb-4" disabled={cartItems.length === 0 || loading}>
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Place Order'}
            </button>
            
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs ${paymentMethod === 'Pesapal' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-purple-600 bg-purple-50 border-purple-100'}`}>
              <ShieldCheck size={20} />
              <div>
                <p className="font-bold uppercase tracking-wider">{paymentMethod === 'Pesapal' ? 'Secure Payment' : 'Wallet Payment'}</p>
                <p>{paymentMethod === 'Pesapal' ? 'Protected by Pesapal' : 'Directly from your balance'}</p>
              </div>
            </div>
            
            {/* Promo Code Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="font-heading font-bold mb-3 text-gray-800 text-sm">Have a promo code?</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                <button type="button" onClick={applyCouponHandler} disabled={validatingCoupon || !couponCode.trim()} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 disabled:opacity-50 text-sm">
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              {couponSuccess && <p className="text-green-600 text-xs mt-2 font-semibold">{couponSuccess}</p>}
              
              {discountDetails.length > 0 && (
                <div className="mt-3 space-y-2">
                  {discountDetails.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                      <div>
                        <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">{c.code}</span>
                        <span className="text-xs text-green-600 ml-2">{c.discountType === 'percentage' ? `${c.discountValue}% off` : `UGX ${c.discountValue.toLocaleString()} off`}</span>
                      </div>
                      <button type="button" onClick={() => dispatch({ type: 'cart/removeCoupon', payload: c.vendor })} className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutScreen;
