'use client';

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { authReducer } from './auth';
import { paymentReducer } from './payment';
import { withdrawReducer } from './withdraw';
import { preferencesReducer } from './preferences';
import { notificationReducer, notificationSocketMiddleware } from './notifications';
import { errorsReducer } from './errors';
import { avatarsReducer } from './avatars';
import { chatReducer, chatSocketMiddleware, chatTimerListenerMiddleware } from './chat';
import { soundListenerMiddleware } from './sound';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    withdraw: withdrawReducer,
    preferences: preferencesReducer,
    notifications: notificationReducer,
    errors: errorsReducer,
    avatars: avatarsReducer,
    chat: chatReducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .prepend(soundListenerMiddleware.middleware)
      .prepend(chatTimerListenerMiddleware.middleware)
      .concat(notificationSocketMiddleware)
      .concat(chatSocketMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
