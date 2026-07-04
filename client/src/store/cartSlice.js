import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: 'MTN Mobile Money',
  appliedCoupons: [], // { couponId, vendor, code, discountType, discountValue, maxDiscountAmount, applicableProducts }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x.product === item.product);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x.product === existItem.product ? item : x
        );
      } else {
        state.cartItems.push(item);
      }
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x.product !== action.payload);
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    clearCartItems: (state) => {
      state.cartItems = [];
      state.appliedCoupons = [];
    },
    applyCoupon: (state, action) => {
      const coupon = action.payload; // { couponId, vendor, code, discountType, discountValue, maxDiscountAmount, applicableProducts }
      // Remove any existing coupon for this vendor
      state.appliedCoupons = state.appliedCoupons.filter(c => c.vendor !== coupon.vendor);
      state.appliedCoupons.push(coupon);
    },
    removeCoupon: (state, action) => {
      const vendorId = action.payload;
      state.appliedCoupons = state.appliedCoupons.filter(c => c.vendor !== vendorId);
    }
  },
});

export const { addToCart, removeFromCart, saveShippingAddress, savePaymentMethod, clearCartItems, applyCoupon, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
