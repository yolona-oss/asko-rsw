import { createAction } from '@reduxjs/toolkit';

// Socket emit actions — middleware intercepts these and emits on the socket.
// No reducer handles them.

export const emitTyping = createAction<string>('chat/emitTyping');
export const emitStopTyping = createAction<string>('chat/emitStopTyping');
export const emitMarkAsRead = createAction<{ conversationId: string; messageId: string }>('chat/emitMarkAsRead');
export const emitUploadingImage = createAction<string>('chat/emitUploadingImage');
export const emitUploadingVideo = createAction<string>('chat/emitUploadingVideo');
export const emitUploadingDocument = createAction<string>('chat/emitUploadingDocument');
export const emitStopUploading = createAction<string>('chat/emitStopUploading');
