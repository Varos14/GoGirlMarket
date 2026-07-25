import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { closeCartDrawer, addToCart, removeFromCart } from '../store/cartSlice';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, isCartDrawerOpen } = useSelector((state) => state.cart);

  if (!isCartDrawerOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const updateQuantity = (item, newQty) => {
    if (newQty <= 0) {
      dispatch(removeFromCart(item.product));
    } else {
      dispatch(addToCart({ ...item, qty: Math.min(newQty, item.countInStock || 99) }));
    }
  };

  const handleCheckout = () => {
    dispatch(closeCartDrawer());
    navigate('/shipping');
  };

  const handleViewCart = () => {
    dispatch(closeCartDrawer());
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={() => dispatch(closeCartDrawer())}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-borderLight shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-borderLight flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-softRose rounded-2xl text-accent">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-heading font-bold text-textPrimary">Your Shopping Cart</h2>
                <p className="text-xs text-textMuted font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch(closeCartDrawer())}
              className="p-2 rounded-full text-textMuted hover:text-textPrimary hover:bg-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Items List) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center text-textMuted">
                  <ShoppingBag className="w-10 h-10 stroke-1" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-textPrimary">Your cart is empty</p>
                  <p className="text-xs text-textMuted max-w-[240px]">
                    Looks like you haven't added anything to your cart yet.
                  </p>
                </div>
                <button
                  onClick={() => dispatch(closeCartDrawer())}
                  className="btn-primary text-xs py-2.5 px-6 font-semibold shadow-xs"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div 
                  key={item.product}
                  className="bg-background rounded-2xl p-4 border border-borderLight flex gap-4 items-center shadow-2xs hover:border-accent/30 transition-all"
                >
                  <img 
                    src={item.image || 'https://via.placeholder.com/150'} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl border border-borderLight flex-shrink-0 bg-surface"
                  />

                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.product}`}
                      onClick={() => dispatch(closeCartDrawer())}
                      className="text-xs font-bold text-textPrimary hover:text-accent truncate block transition-colors"
                    >
                      {item.name}
                    </Link>

                    <p className="text-xs font-bold text-accent mt-0.5">
                      UGX {item.price?.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-borderLight rounded-xl bg-surface">
                        <button
                          onClick={() => updateQuantity(item, item.qty - 1)}
                          className="p-1 text-textMuted hover:text-textPrimary transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-textPrimary">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item, item.qty + 1)}
                          className="p-1 text-textMuted hover:text-textPrimary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeFromCart(item.product))}
                        className="p-1.5 text-textMuted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-borderLight bg-surface space-y-4 shadow-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-textMuted">
                  <span>Shipping & Delivery</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Arranged via WhatsApp
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-heading font-bold text-textPrimary pt-1">
                  <span>Subtotal</span>
                  <span className="text-base text-accent">UGX {subtotal?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleCheckout}
                  className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleViewCart}
                  className="w-full btn-secondary py-2.5 text-xs font-semibold text-textMuted hover:text-textPrimary transition-colors"
                >
                  View Full Cart Page
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
