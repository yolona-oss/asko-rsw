import { createAction } from '@reduxjs/toolkit';

export const playSound = createAction<string>('sound/play');
export const startReminder = createAction<string>('sound/startReminder');
export const stopReminder = createAction<string>('sound/stopReminder');
