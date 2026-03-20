'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dealerApi } from '@/lib/api/dealer';

export interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  requestedAt: Date | string;
  processedAt?: Date | string;
}

export interface WithdrawState {
  withdrawals: Withdrawal[];
  loading: boolean;
  requesting: boolean;
  error: string | null;
}

const initialState: WithdrawState = {
  withdrawals: [],
  loading: false,
  requesting: false,
  error: null,
};

export const getMyWithdraws = createAsyncThunk(
  'withdraw/getMy',
  async () => {
    const { data } = await dealerApi.getMyWithdrawals();
    return data;
  },
);

export const requestWithdraw = createAsyncThunk(
  'withdraw/request',
  async (amount: number) => {
    const { data } = await dealerApi.requestWithdraw(amount);
    return data;
  },
);

export const withdrawSlice = createSlice({
  name: 'withdraw',
  initialState,
  reducers: {
    resetWithdrawError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyWithdraws.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyWithdraws.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload;
      })
      .addCase(getMyWithdraws.rejected, (state) => {
        state.loading = false;
      })
      .addCase(requestWithdraw.pending, (state) => {
        state.requesting = true;
        state.error = null;
      })
      .addCase(requestWithdraw.fulfilled, (state, action) => {
        state.requesting = false;
        state.withdrawals.unshift(action.payload);
      })
      .addCase(requestWithdraw.rejected, (state, action) => {
        state.requesting = false;
        state.error = action.error.message ?? 'Withdraw request failed';
      });
  },
});

export const { resetWithdrawError } = withdrawSlice.actions;
export default withdrawSlice.reducer;
