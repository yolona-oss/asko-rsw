'use client';

import { useState, useMemo } from 'react';
import type { ChatMessage } from '@/lib/chat-types';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

interface Attachment {
  // Image fields
  imageId?: string;
  url?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  width?: number;
  height?: number;
  // Video fields
  videoId?: string;
  format?: string;
  duration?: number;
  originalFilename?: string;
}

function parseAttachment(raw?: string): Attachment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [expanded, setExpanded] = useState(false);
  const src = attachment.url || attachment.originalUrl || '';

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="block cursor-pointer rounded-lg overflow-hidden my-1"
      >
        <img
          src={src}
          alt="Изображение"
          loading="lazy"
          className="max-w-[240px] max-h-[240px] object-cover rounded-lg"
        />
      </button>

      {/* Fullscreen overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl cursor-pointer hover:bg-white/30 transition-colors"
          >
            &times;
          </button>
          <img
            src={attachment.originalUrl || src}
            alt="Изображение"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function VideoAttachment({ attachment }: { attachment: Attachment }) {
  const src = attachment.url || '';
  if (!src) return null;

  return (
    <div className="my-1 rounded-lg overflow-hidden max-w-[300px]">
      <video
        src={src}
        controls
        preload="metadata"
        className="w-full rounded-lg"
      >
        Видео не поддерживается
      </video>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isOwn, showSender, senderName }: MessageBubbleProps) {
  const attachment = useMemo(() => parseAttachment(message.attachmentJson), [message.attachmentJson]);

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-text-sub/60 bg-page-bg px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  const isMedia = message.type === 'image' || message.type === 'video';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwn
            ? 'bg-dark text-white rounded-br-sm'
            : 'bg-white border border-border-light rounded-bl-sm'
        }`}
      >
        {showSender && senderName && !isOwn && (
          <p className="text-xs font-medium text-brand-red mb-0.5">{senderName}</p>
        )}

        {/* Media attachment */}
        {isMedia && attachment && (
          message.type === 'image'
            ? <ImageAttachment attachment={attachment} />
            : <VideoAttachment attachment={attachment} />
        )}

        {/* Text content */}
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {/* Timestamp */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
          <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-text-sub/60'}`}>
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className={`text-[10px] ${isOwn ? 'text-white/40' : 'text-text-sub/40'}`}>
              изменено
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
