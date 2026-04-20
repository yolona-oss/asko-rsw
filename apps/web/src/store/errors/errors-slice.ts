import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ErrorSeverity = 'low' | 'normal' | 'high' | 'critical';

export interface ErrorEntry {
    id: string;
    title: string;
    message: string;
    details?: string;
    severity: ErrorSeverity;
}

export interface ErrorsState {
    errors: ErrorEntry[];
}

const initialState: ErrorsState = {
    errors: [],
};

const errorsSlice = createSlice({
    name: 'errors',
    initialState,
    reducers: {
        showError: {
            reducer(state, action: PayloadAction<ErrorEntry>) {
                state.errors.push(action.payload);
            },
            prepare(message: string, title = 'Ошибка', details?: string, severity: ErrorSeverity = 'normal') {
                return {
                    payload: {
                        id: Math.random().toString(36).slice(2),
                        title,
                        message,
                        details,
                        severity,
                    },
                };
            },
        },
        dismissError(state, action: PayloadAction<string>) {
            state.errors = state.errors.filter((e) => e.id !== action.payload);
        },
        dismissAll(state) {
            state.errors = [];
        },
    },
});

export const { showError, dismissError, dismissAll } = errorsSlice.actions;

export const selectErrors = (state: { errors: ErrorsState }) => state.errors.errors;

export default errorsSlice.reducer;
