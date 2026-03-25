'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { chatApi } from '@/lib/api/chat';

interface MessageInputProps {
  conversationId: string;
  onMessageSent: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function MessageInput({ conversationId, onMessageSent, onTyping, onStopTyping }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

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

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    if (isTyping.current) {
      isTyping.current = false;
      onStopTyping();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }

    try {
      await chatApi.sendMessage(conversationId, { type: 'text', text: trimmed });
      setText('');
      onMessageSent();
    } catch {
      // silently fail
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
    <div className="border-t border-border-light p-3 flex items-end gap-2">
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
      <button
        type="button"
        onClick={send}
        disabled={!text.trim() || sending}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-dark text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-opacity"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}
