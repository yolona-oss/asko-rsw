'use client';

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from '@/components/account/layout/provider';
import { SkeletonBlock } from '@/components/skeleton';

const ChatLayout = lazy(() => import('@/components/chat/chat-layout').then(m => ({ default: m.ChatLayout })));

function ChatSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:p-8">
      <SkeletonBlock className="flex-1 w-full" />
    </div>
  );
}

function ChatPageInner() {
  const { user } = useAccount();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversation') ?? undefined;

  if (!user) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:p-8">
      <ChatLayout currentUserId={user.id} initialConversationId={initialConversationId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageInner />
    </Suspense>
  );
}
