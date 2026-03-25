'use client';

import type { ChatMessage } from '@/lib/chat-types';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isOwn, showSender, senderName }: MessageBubbleProps) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-text-sub/60 bg-page-bg px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

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
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}
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
