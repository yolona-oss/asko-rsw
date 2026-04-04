'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { chatApi } from '@/lib/api/chat';
import { fileUploadApi } from '@/lib/api/file-upload';
import { getImageUrl, getVideoUrl } from '@/lib/file-url';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/jpg';
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/mov,video/quicktime';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

interface AttachedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface MessageInputProps {
  conversationId: string;
  onMessageSent: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function MessageInput({ conversationId, onMessageSent, onTyping, onStopTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      onTyping();
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onStopTyping();
    }, 2000);
  }, [onTyping, onStopTyping]);

  const clearAttachment = useCallback(() => {
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [attachment]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError('Поддерживаются только изображения и видео');
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setUploadError('Изображение не должно превышать 10 МБ');
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      setUploadError('Видео не должно превышать 100 МБ');
      return;
    }

    // Clean up previous preview
    if (attachment) {
      URL.revokeObjectURL(attachment.preview);
    }

    setAttachment({
      file,
      preview: URL.createObjectURL(file),
      type: isImage ? 'image' : 'video',
    });
  }, [attachment]);

  const send = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || sending) return;

    setSending(true);
    setUploadError(null);
    if (isTyping.current) {
      isTyping.current = false;
      onStopTyping();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }

    try {
      if (attachment) {
        // Upload file first, then send as image/video message
        if (attachment.type === 'image') {
          const { data: uploaded } = await fileUploadApi.uploadImage(attachment.file);
          const img = uploaded.image;
          await chatApi.sendMessage(conversationId, {
            type: 'image',
            text: trimmed || undefined,
            attachment: {
              imageId: img.id,
              url: getImageUrl(img.id),
              thumbnailUrl: getImageUrl(img.id),
              originalUrl: getImageUrl(img.id),
              width: img.imageJson?.original?.width,
              height: img.imageJson?.original?.height,
            },
          });
        } else {
          const { data: uploaded } = await fileUploadApi.uploadVideo(attachment.file);
          const vid = uploaded.video;
          await chatApi.sendMessage(conversationId, {
            type: 'video',
            text: trimmed || undefined,
            attachment: {
              videoId: vid.id,
              url: getVideoUrl(vid.id),
              format: vid.videoJson?.format,
              duration: vid.videoJson?.duration,
              originalFilename: vid.videoJson?.original_filename,
            },
          });
        }
        clearAttachment();
      } else {
        await chatApi.sendMessage(conversationId, { type: 'text', text: trimmed });
      }
      setText('');
      onMessageSent();
    } catch {
      setUploadError('Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-border-light">
      {/* Upload error */}
      {uploadError && (
        <div className="px-3 pt-2">
          <p className="text-xs text-red-500">{uploadError}</p>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="px-3 pt-3">
          <div className="relative inline-block">
            {attachment.type === 'image' ? (
              <img
                src={attachment.preview}
                alt="Прикрепленное изображение"
                className="h-20 max-w-[160px] object-cover rounded-lg border border-border-light"
              />
            ) : (
              <div className="h-20 w-[160px] flex items-center justify-center bg-gray-100 rounded-lg border border-border-light">
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto text-text-sub" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <p className="text-[10px] text-text-sub mt-0.5 truncate max-w-[140px] px-1">
                    {attachment.file.name}
                  </p>
                </div>
              </div>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={clearAttachment}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-dark text-white text-xs cursor-pointer hover:bg-red-600 transition-colors"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="p-3 flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-text-sub hover:text-text-main hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Прикрепить файл"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          rows={1}
          className="flex-1 resize-none border border-border-light rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-sub/50 focus:outline-none focus:border-text-main max-h-32 overflow-y-auto"
          style={{ minHeight: '40px' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={send}
          disabled={(!text.trim() && !attachment) || sending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-dark text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-opacity"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
