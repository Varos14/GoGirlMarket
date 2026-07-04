import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import { createOrder, orderCreateReset } from '../store/orderSlice';
import { clearCartItems } from '../store/cartSlice';
import { ShieldCheck } from 'lucide-react';

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const orderCreate = useSelector((state) => state.order);
  const { order, success, error, loading } = orderCreate;

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Calculate prices
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(0);
  };

  const itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );
  
  // Calculate total discount from applied coupons
  const totalDiscount = cart.appliedCoupons?.reduce((total, coupon) => {
    // get items for this vendor
    const vendorItems = cart.cartItems.filter(item => item.vendor === coupon.vendor);
    const vendorSubtotal = vendorItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = vendorSubtotal * (coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }
    
    return total + Math.min(discount, vendorSubtotal);
  }, 0) || 0;

  const itemsPriceAfterDiscount = itemsPrice - totalDiscount;

  // Calculate unique vendors in the cart
  const uniqueVendors = [...new Set(cart.cartItems.map(item => item.vendor).filter(Boolean))];
  const numVendors = uniqueVendors.length > 0 ? uniqueVendors.length : 1; // Default to 1 if missing for some reason

  const shippingPrice = itemsPriceAfterDiscount > 100000 ? 0 : 5000 * numVendors; // 5000 UGX per vendor
  
  const taxPrice = addDecimals(Number((0.15 * itemsPriceAfterDiscount).toFixed(0))); // 15% tax
  const totalPrice = (
    Number(itemsPriceAfterDiscount) +
    Number(shippingPrice) +
    Number(taxPrice)
  ).toFixed(0);

  useEffect(() => {
    if (success) {
      dispatch(clearCartItems());
      dispatch(orderCreateReset());
      navigate(`/order/${order._id}`);
    }
  }, [navigate, success, dispatch, order]);

  const placeOrderHandler = () => {
    dispatch(
      createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: itemsPriceAfterDiscount, // Note: storing the discounted items price
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalPrice: totalPrice,
        appliedCoupons: cart.appliedCoupons || []
      })
    );
  };

  const applyCouponHandler = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError('');
    
    try {
      const response = await fetch(`/api/coupons/validate/${couponCode}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid coupon');
      }
      
      // Check if we have items from this vendor
      const hasVendorItems = cart.cartItems.some(item => item.vendor === data.vendor);
      if (!hasVendorItems) {
        throw new Error('This coupon is not valid for any items in your cart');
      }
      
      dispatch({ type: 'cart/applyCoupon', payload: data });
      setCouponCode('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CheckoutSteps step1 step2 step3 step4 />
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Order Details */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Home Delivery Details</h2>
            <p className="text-gray-700">
              {cart.shippingAddress.phone && <><span className="font-bold">Phone: </span> {cart.shippingAddress.phone} <br/></>}
              <span className="font-bold">Address: </span>
              {cart.shippingAddress.address}, {cart.shippingAddress.city},{' '}
              {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Payment Method</h2>
            <p className="text-gray-700">
              <span className="font-bold">Method: </span>
              {cart.paymentMethod}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Order Items</h2>
            {cart.cartItems.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cart.cartItems.map((item, index) => (
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
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-heading font-bold mb-6 border-b pb-2">Order Summary</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm" role="alert">{error}</div>}
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Subtotal</span>
                <span className="font-semibold">UGX {Number(itemsPrice).toLocaleString()}</span>
              </div>
              
              {cart.appliedCoupons && cart.appliedCoupons.length > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount</span>
                  <span>- UGX {Number(totalDiscount).toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 mb-2">
                  <span>Shipping ({numVendors} vendor{numVendors > 1 ? 's' : ''})</span>
                  <span className="font-medium">UGX {shippingPrice.toLocaleString()}</span>
                </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">UGX {Number(taxPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">UGX {Number(totalPrice).toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full btn-primary py-3 text-lg flex justify-center items-center mb-4"
              disabled={cart.cartItems.length === 0 || loading}
              onClick={placeOrderHandler}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Place Order'
              )}
            </button>
            
            {cart.paymentMethod === 'Cash on Delivery' ? (
              <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">Pay on Delivery</p>
                  <p className="text-blue-700">Have exact change ready</p>
                </div>
              </div>
            ) : cart.paymentMethod === 'In-App Wallet Balance' ? (
              <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <ShieldCheck size={20} />
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">Wallet Payment</p>
                  <p className="text-purple-700">Directly from your balance</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                <ShieldCheck size={20} />
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">Secure Payment</p>
                  <p className="text-green-700">Protected by Flutterwave</p>
                </div>
              </div>
            )}
            
            {/* Promo Code Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="font-heading font-bold mb-3 text-gray-800">Have a promo code?</h3>
              <form onSubmit={applyCouponHandler} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              
              {cart.appliedCoupons && cart.appliedCoupons.length > 0 && (
                <div className="mt-3 space-y-2">
                  {cart.appliedCoupons.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                      <div>
                        <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">{c.code}</span>
                        <span className="text-xs text-green-600 ml-2">
                          {c.discountType === 'percentage' ? `${c.discountValue}% off` : `UGX ${c.discountValue} off`}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => dispatch({ type: 'cart/removeCoupon', payload: c.vendor })}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none"
                      >
                        &times;
                      </button>
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

export default PlaceOrderScreen;
