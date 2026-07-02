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

  // Calculate prices
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(0);
  };

  const itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );
  
  // Calculate unique vendors in the cart
  const uniqueVendors = [...new Set(cart.cartItems.map(item => item.vendor).filter(Boolean))];
  const numVendors = uniqueVendors.length > 0 ? uniqueVendors.length : 1; // Default to 1 if missing for some reason

  const shippingPrice = itemsPrice > 100000 ? 0 : 5000 * numVendors; // 5000 UGX per vendor
  
  const taxPrice = addDecimals(Number((0.15 * itemsPrice).toFixed(0))); // 15% tax
  const totalPrice = (
    Number(itemsPrice) +
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
        itemsPrice: itemsPrice,
        shippingPrice: shippingPrice,
        taxPrice: taxPrice,
        totalPrice: totalPrice,
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CheckoutSteps step1 step2 step3 step4 />
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Order Details */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-heading font-bold mb-4 border-b pb-2">Shipping</h2>
            <p className="text-gray-700">
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
                <span className="text-gray-600">Items</span>
                <span className="font-semibold">UGX {Number(itemsPrice).toLocaleString()}</span>
              </div>
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
            
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
              <ShieldCheck size={20} />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">Secure Payment</p>
                <p className="text-green-700">Protected by Flutterwave</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderScreen;
