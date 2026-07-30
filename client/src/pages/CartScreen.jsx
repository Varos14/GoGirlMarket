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
    navigate('/login?redirect=/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-borderLight pb-4">
        <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Shopping Bag</span>
        <h1 className="text-3xl font-heading font-bold text-primary">Your Cart</h1>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-borderLight text-center space-y-4">
          <span className="text-5xl">🛍️</span>
          <p className="text-base font-semibold text-primary">Your shopping cart is empty.</p>
          <p className="text-xs text-textMuted max-w-sm mx-auto">Explore our latest arrivals and find something special to fill your cart.</p>
          <div className="pt-2">
            <Link to="/shop" className="btn-primary py-3 px-8 text-xs inline-block">
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.product} className="shoppe-card p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="w-24 h-24 bg-background rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-borderLight">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-textMuted">No Image</span>
                  )}
                </div>
                
                <div className="flex-grow flex flex-col sm:flex-row justify-between w-full gap-4 items-center">
                  <div className="space-y-1 text-center sm:text-left">
                    <Link to={`/product/${item.product}`} className="font-heading font-semibold text-base text-primary hover:text-accent transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-xs font-bold text-primary">UGX {item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-background rounded-full border border-borderLight p-1">
                      <button 
                        onClick={() => dispatch(addToCart({ ...item, qty: Math.max(1, item.qty - 1) }))}
                        className="w-7 h-7 rounded-full bg-surface text-primary font-bold text-xs flex items-center justify-center hover:bg-cream transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 font-bold text-xs text-primary">{item.qty}</span>
                      <button 
                        onClick={() => dispatch(addToCart({ ...item, qty: Math.min(item.countInStock, item.qty + 1) }))}
                        className="w-7 h-7 rounded-full bg-surface text-primary font-bold text-xs flex items-center justify-center hover:bg-cream transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeFromCartHandler(item.product)}
                      className="p-2 text-textMuted hover:text-accent transition-colors rounded-full hover:bg-cream"
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-surface p-6 rounded-3xl border border-borderLight shadow-xs space-y-4">
              <h2 className="text-lg font-heading font-bold text-primary border-b border-borderLight pb-3">Order Summary</h2>
              
              <div className="flex justify-between text-xs text-textMuted">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span className="font-semibold text-primary">
                  UGX {cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-textMuted">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-emerald-600">Calculated next step</span>
              </div>

              {/* Promo code input */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Promo Code (GOGIRL20)" 
                    className="w-full bg-background border border-borderLight text-xs p-2.5 rounded-xl outline-none focus:border-accent"
                  />
                  <button className="btn-secondary py-2 px-4 text-xs">Apply</button>
                </div>
              </div>
              
              <div className="flex justify-between border-t border-borderLight pt-4 text-base font-bold text-primary">
                <span>Total</span>
                <span className="text-primary font-bold">
                  UGX {cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toLocaleString()}
                </span>
              </div>
              
              <button 
                type="button" 
                className="w-full btn-primary py-3.5 text-xs font-semibold shadow-md hover:shadow-lg"
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
