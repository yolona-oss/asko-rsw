'use client';

import { useState, useMemo } from 'react';
import { LightboxModal } from '@asko/ui';
import type { ChatMessage } from '@/lib/chat-types';
import { MessageStatusIcon } from './message-status-icon';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

interface Attachment {
  imageId?: string;
  url?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  width?: number;
  height?: number;
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

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  senderName?: string;
  /** All image URLs from the conversation, for lightbox prev/next navigation */
  conversationImages?: string[];
}

export function MessageBubble({ message, isOwn, showSender, senderName, conversationImages }: MessageBubbleProps) {
  const attachment = useMemo(() => parseAttachment(message.attachmentJson), [message.attachmentJson]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
  const imageSrc = attachment?.url || attachment?.originalUrl || '';
  const allImages = conversationImages ?? [];
  const imageIndex = imageSrc ? allImages.indexOf(imageSrc) : -1;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] rounded-2xl overflow-hidden ${
          isOwn
            ? 'bg-dark text-white rounded-br-sm'
            : 'bg-white border border-border-light rounded-bl-sm'
        }`}
      >
        {showSender && senderName && !isOwn && (
          <p className="text-xs font-medium text-brand-red px-3 pt-2 mb-0.5">{senderName}</p>
        )}

        {/* Image attachment — no horizontal padding, only bottom padding for timestamp */}
        {isMedia && attachment && message.type === 'image' && imageSrc && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block cursor-pointer w-full"
          >
            <img
              src={imageSrc}
              alt="Изображение"
              loading="lazy"
              className="max-w-[280px] max-h-[280px] object-cover w-full"
            />
          </button>
        )}

        {/* Video attachment — no horizontal padding */}
        {isMedia && attachment && message.type === 'video' && attachment.url && (
          <div className="max-w-[300px]">
            <video
              src={attachment.url}
              controls
              preload="metadata"
              className="w-full"
            >
              Видео не поддерживается
            </video>
          </div>
        )}

        {/* Text content + timestamp area */}
        <div className="px-3 py-1.5">
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* Timestamp + edit label + status icon */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-text-sub/60'}`}>
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className={`text-[10px] ${isOwn ? 'text-white/40' : 'text-text-sub/40'}`}>
                изменено
              </span>
            )}
            {isOwn && <MessageStatusIcon status={message.status} />}
          </div>
        </div>
      </div>

      {/* LightboxModal for fullscreen image viewing */}
      {lightboxOpen && imageSrc && (
        <LightboxModal
          images={allImages.length > 0 ? allImages : [imageSrc]}
          alt="Изображение"
          startIndex={imageIndex >= 0 ? imageIndex : 0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
