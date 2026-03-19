'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentApi, type PaymentOptions, type CreatePaymentParams, type CreatePaymentResult } from '@/lib/api/payment';

export interface PaymentState {
  options: PaymentOptions | null;
  optionsLoading: boolean;
  creating: boolean;
  result: CreatePaymentResult | null;
  error: string | null;
}

const initialState: PaymentState = {
  options: null,
  optionsLoading: false,
  creating: false,
  result: null,
  error: null,
};

export const fetchPaymentOptions = createAsyncThunk(
  'payment/fetchOptions',
  async () => {
    const { data } = await paymentApi.getOptions();
    return data;
  },
);

export const createPayment = createAsyncThunk(
  'payment/create',
  async (params: CreatePaymentParams) => {
    const { data } = await paymentApi.createPayment(params);
    return data;
  },
);

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    resetPayment(state) {
      state.result = null;
      state.error = null;
      state.creating = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentOptions.pending, (state) => {
        state.optionsLoading = true;
      })
      .addCase(fetchPaymentOptions.fulfilled, (state, action) => {
        state.options = action.payload;
        state.optionsLoading = false;
      })
      .addCase(fetchPaymentOptions.rejected, (state) => {
        state.optionsLoading = false;
      })
      .addCase(createPayment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.creating = false;
        state.result = action.payload;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message ?? 'Payment failed';
      });
  },
});

export const { resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
