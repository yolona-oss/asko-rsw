import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setTyping, clearTyping, setUploading, clearUploading } from './chat-slice';

const TYPING_TIMEOUT_MS = 3000;
const UPLOADING_TIMEOUT_MS = 15000;

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const uploadingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const chatTimerListenerMiddleware = createListenerMiddleware();

chatTimerListenerMiddleware.startListening({
    actionCreator: setTyping,
    effect: (action, listenerApi) => {
        const userId = action.payload.userId;

        const existing = typingTimers.get(userId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            listenerApi.dispatch(clearTyping(userId));
            typingTimers.delete(userId);
        }, TYPING_TIMEOUT_MS);
        typingTimers.set(userId, timer);
    },
});

chatTimerListenerMiddleware.startListening({
    actionCreator: setUploading,
    effect: (action, listenerApi) => {
        const userId = action.payload.userId;

        const existing = uploadingTimers.get(userId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            listenerApi.dispatch(clearUploading(userId));
            uploadingTimers.delete(userId);
        }, UPLOADING_TIMEOUT_MS);
        uploadingTimers.set(userId, timer);
    },
});
