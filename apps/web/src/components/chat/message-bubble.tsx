'use client';

import { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Download } from 'lucide-react';
import { LightboxModal } from '@asko/ui';
import type { ChatMessage } from '@/lib/chat-types';
import { getImageUrl, getVideoUrl } from '@/lib/file-url';
import { openDocument, downloadDocument } from '@/lib/file-url';
import { MessageStatusIcon } from './message-status-icon';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function toNumberSize(bytes: unknown): number {
  if (typeof bytes === 'number') return bytes;
  if (typeof bytes === 'string') return Number(bytes) || 0;
  if (bytes && typeof bytes === 'object') {
    const { low, high, unsigned } = bytes as { low?: number; high?: number; unsigned?: boolean };
    if (typeof low === 'number' && typeof high === 'number') {
      return unsigned
        ? high * 0x100000000 + (low >>> 0)
        : high * 0x100000000 + (low >>> 0);
    }
  }
  return 0;
}

function formatFileSize(bytes?: number): string {
  const n = toNumberSize(bytes);
  if (!n) return '';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
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
  conversationImages?: string[];
  /** Pre-computed per-user read receipts for this message (null = no receipt data) */
  receipts?: { userId: string; seen: boolean }[] | null;
  participantNames?: Record<string, string>;
}

export function MessageBubble({ message, isOwn, showSender, senderName, senderRole, conversationImages, receipts, participantNames }: MessageBubbleProps) {
  const attachment = useMemo(() => parseAttachment(message.attachmentJson), [message.attachmentJson]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptTriggerRef = useRef<HTMLButtonElement>(null);

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
            {isOwn && receipts && receipts.length > 0 ? (
              <>
                <button
                  ref={receiptTriggerRef}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setReceiptOpen(v => !v); }}
                  className="inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <MessageStatusIcon status={message.status} dark />
                  {receipts.length > 1 && (
                    <span className={`text-[9px] ${message.status === 'seen' ? 'text-info' : 'text-text-on-dark/50'}`}>
                      {receipts.filter(r => r.seen).length}/{receipts.length}
                    </span>
                  )}
                </button>
                {receiptOpen && (
                  <ReadReceiptPopup
                    receipts={receipts}
                    participantNames={participantNames ?? {}}
                    messageCreatedAt={message.createdAt}
                    anchorRef={receiptTriggerRef}
                    onClose={() => setReceiptOpen(false)}
                  />
                )}
              </>
            ) : isOwn ? (
              <MessageStatusIcon status={message.status} dark />
            ) : null}
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

// ─── Read Receipt Detail Popup ──────────────────────────────────

function ReadReceiptPopup({
  receipts,
  participantNames,
  messageCreatedAt,
  anchorRef,
  onClose,
}: {
  receipts: { userId: string; seen: boolean }[];
  participantNames: Record<string, string>;
  messageCreatedAt: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPos({ top: rect.top - 4, left: rect.right });
  }, [anchorRef]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose, anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-surface border border-border-light shadow-lg py-1.5 min-w-[180px]"
      style={{ top: pos.top, left: pos.left, transform: 'translate(-100%, -100%)' }}
    >
      <p className="text-[10px] font-medium text-text-sub px-3 pb-1 border-b border-border-light/50 mb-1">
        Статус доставки
      </p>
      {receipts.map(r => (
        <div key={r.userId} className="flex items-center justify-between gap-3 px-3 py-1">
          <span className="text-[11px] text-text-main truncate">
            {participantNames[r.userId] || r.userId.slice(0, 8)}
          </span>
          <span className={`text-[10px] flex-shrink-0 ${r.seen ? 'text-info' : 'text-text-sub/50'}`}>
            {r.seen ? 'Прочитано' : 'Доставлено'}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-text-sub/40 px-3 pt-1 border-t border-border-light/50 mt-1">
        Отправлено {formatTime(messageCreatedAt)}
      </p>
    </div>,
    document.body,
  );
}
