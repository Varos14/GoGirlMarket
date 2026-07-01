import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import productReducer from './productSlice';
import authReducer from './authSlice';
import orderReducer from './orderSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productReducer,
    auth: authReducer,
    order: orderReducer,
  },
});

export default store;
