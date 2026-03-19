'use client';

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './auth-slice';
import paymentReducer from './payment-slice';
import withdrawReducer from './withdraw-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    withdraw: withdrawReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
