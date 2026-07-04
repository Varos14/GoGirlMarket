import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ keyword = '', category = '', sort = '', pageNumber = 1 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/products?keyword=${keyword}&category=${category}&sort=${sort}&pageNumber=${pageNumber}`);
      return { ...data, pageNumber }; // Pass pageNumber so reducer knows whether to append or replace
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'products/fetchProductDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const createProductReview = createAsyncThunk(
  'products/createReview',
  async ({ productId, review }, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(`/api/products/${productId}/reviews`, review, config);
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const initialState = {
  products: [],
  productDetails: null,
  loading: false,
  error: null,
  page: 1,
  pages: 1,
  reviewLoading: false,
  reviewError: null,
  reviewSuccess: false,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    productReviewCreateReset: (state) => {
      state.reviewSuccess = false;
      state.reviewError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        // Only set loading to true if we are fetching page 1 (initial load). 
        // For infinite scroll, we might not want to show a full-page loader.
        const pageNumber = action.meta.arg?.pageNumber || 1;
        if (pageNumber === 1) {
          state.loading = true;
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.pageNumber > 1) {
          // Append for infinite scroll
          state.products = [...state.products, ...action.payload.products];
        } else {
          // Replace for new search/filter
          state.products = action.payload.products;
        }
        
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    // Fetch Product Details
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetails = action.payload;
        state.error = null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Product Review
      .addCase(createProductReview.pending, (state) => {
        state.reviewLoading = true;
      })
      .addCase(createProductReview.fulfilled, (state) => {
        state.reviewLoading = false;
        state.reviewSuccess = true;
        state.reviewError = null;
      })
      .addCase(createProductReview.rejected, (state, action) => {
        state.reviewLoading = false;
        state.reviewError = action.payload;
      });
  },
});

export const { productReviewCreateReset } = productSlice.actions;

export default productSlice.reducer;
