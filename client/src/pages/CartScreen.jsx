import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../store/cartSlice';

const CartScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
  };

  const checkoutHandler = () => {
    navigate('/login?redirect=/shipping');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-heading font-bold text-textPrimary mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-xl text-gray-500 mb-6">Your cart is currently empty.</p>
          <Link to="/shop" className="btn-primary inline-block">Go Back to Shop</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.product} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-surface rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-400">Image</span>
                      )}
                    </div>
                    
                    <div className="flex-grow flex flex-col sm:flex-row justify-between w-full gap-4 items-center">
                      <div className="flex-grow text-center sm:text-left">
                        <Link to={`/product/${item.product}`} className="font-heading font-semibold text-lg text-textPrimary hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                      </div>
                      
                      <div className="font-bold text-lg text-primary w-24 text-center sm:text-right">
                        UGX {item.price.toLocaleString()}
                      </div>
                      
                      <select 
                        value={item.qty} 
                        onChange={(e) => dispatch(addToCart({ ...item, qty: Number(e.target.value) }))}
                        className="border rounded-md p-2 outline-none focus:border-primary w-20 text-center"
                      >
                        {[...Array(item.countInStock).keys()].map((x) => (
                          <option key={x + 1} value={x + 1}>
                            {x + 1}
                          </option>
                        ))}
                      </select>
                      
                      <button 
                        type="button" 
                        onClick={() => removeFromCartHandler(item.product)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2"
                        title="Remove from Cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-heading font-bold border-b pb-4 mb-4">Order Summary</h2>
              
              <div className="flex justify-between mb-4 text-gray-600">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span className="font-bold text-textPrimary">
                  UGX {cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between mb-6 text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div className="flex justify-between border-t pt-4 mb-8 text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">
                  UGX {cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toLocaleString()}
                </span>
              </div>
              
              <button 
                type="button" 
                className="w-full btn-primary py-3 text-lg"
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
