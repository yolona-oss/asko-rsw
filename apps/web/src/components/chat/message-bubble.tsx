'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileText, Download } from 'lucide-react';
import { LightboxModal } from '@asko/ui';
import type { ChatMessage } from '@/lib/chat-types';
import { getImageUrl, getVideoUrl } from '@/lib/file-url';
import { openDocument, downloadDocument } from '@/lib/file-url';
import { MessageStatusIcon } from './message-status-icon';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
  documentId?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
}

function parseAttachment(raw?: string): Attachment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Суперадмин',
  admin: 'Администратор',
  manager: 'Менеджер',
  dealer: 'Дилер',
  repairer: 'Мастер',
};

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  senderName?: string;
  senderRole?: string;
  /** All image URLs from the conversation, for lightbox prev/next navigation */
  conversationImages?: string[];
}

export function MessageBubble({ message, isOwn, showSender, senderName, senderRole, conversationImages }: MessageBubbleProps) {
  const attachment = useMemo(() => parseAttachment(message.attachmentJson), [message.attachmentJson]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleOpenDocument = useCallback(() => {
    if (attachment?.documentId) {
      openDocument(attachment.documentId);
    }
  }, [attachment?.documentId]);

  const handleDownloadDocument = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (attachment?.documentId) {
      downloadDocument(attachment.documentId, attachment.filename);
    }
  }, [attachment?.documentId, attachment?.filename]);

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
  const isDocument = message.type === 'document';
  const imageSrc = (attachment?.imageId ? getImageUrl(attachment.imageId) : null)
    ?? (attachment?.url ?? attachment?.originalUrl ?? '');
  const videoSrc = (attachment?.videoId ? getVideoUrl(attachment.videoId) : null)
    ?? (attachment?.url ?? '');
  const allImages = conversationImages ?? [];
  const imageIndex = imageSrc ? allImages.indexOf(imageSrc) : -1;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] rounded-2xl overflow-hidden ${
          isOwn
            ? 'bg-dark text-text-on-dark rounded-br-sm'
            : 'bg-surface border border-border-light rounded-bl-sm'
        }`}
      >
        {showSender && senderName && !isOwn && (
          <div className="flex items-center gap-1.5 px-3 pt-2 mb-0.5">
            <span className="text-xs font-medium text-brand-red">{senderName}</span>
            {senderRole && ROLE_LABELS[senderRole] && (
              <span className="text-[10px] font-medium text-text-sub bg-surface-secondary px-1 py-px">{ROLE_LABELS[senderRole]}</span>
            )}
          </div>
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
        {isMedia && attachment && message.type === 'video' && videoSrc && (
          <div className="max-w-[300px]">
            <video
              src={videoSrc}
              controls
              preload="metadata"
              className="w-full"
            >
              Видео не поддерживается
            </video>
          </div>
        )}

        {/* Document attachment */}
        {isDocument && attachment?.documentId && (
          <button
            type="button"
            onClick={handleOpenDocument}
            className={`flex items-center gap-3 px-3 pt-2.5 pb-0.5 w-full min-w-[200px] max-w-[320px] text-left cursor-pointer group`}
          >
            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg ${
              isOwn ? 'bg-white/10' : 'bg-surface-secondary'
            }`}>
              <FileText className={`w-5 h-5 ${isOwn ? 'text-text-on-dark/80' : 'text-text-sub'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${
                isOwn ? 'text-text-on-dark group-hover:underline' : 'text-text-main group-hover:underline'
              }`}>
                {attachment.filename || 'Документ'}
              </p>
              <p className={`text-[11px] ${isOwn ? 'text-text-on-dark/50' : 'text-text-sub/60'}`}>
                {formatFileSize(attachment.sizeBytes)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadDocument}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                isOwn
                  ? 'text-text-on-dark/60 hover:text-text-on-dark hover:bg-white/10'
                  : 'text-text-sub hover:text-text-main hover:bg-surface-secondary'
              }`}
              title="Скачать"
            >
              <Download className="w-4 h-4" />
            </button>
          </button>
        )}

        {/* Text content + timestamp area */}
        <div className="px-3 py-1.5">
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* Timestamp + edit label + status icon */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
            <span className={`text-[10px] ${isOwn ? 'text-text-on-dark/60' : 'text-text-sub/60'}`}>
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className={`text-[10px] ${isOwn ? 'text-text-on-dark/40' : 'text-text-sub/40'}`}>
                изменено
              </span>
            )}
            {isOwn && <MessageStatusIcon status={message.status} dark />}
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
