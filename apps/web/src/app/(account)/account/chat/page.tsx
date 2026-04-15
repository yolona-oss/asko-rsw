'use client';

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from '@/components/account/layout/provider';
import { PageHeader } from '@/components/account/layout/page-header';
import { SkeletonBlock } from '@/components/skeleton';

const ChatLayout = lazy(() => import('@/components/chat/chat-layout').then(m => ({ default: m.ChatLayout })));

function ChatSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:p-8 lg:gap-8">
      <SkeletonBlock className="hidden lg:block h-9 w-48" />
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
    <div className="flex-1 min-h-0 flex flex-col lg:p-8 lg:gap-8">
      <PageHeader className="hidden lg:block">Сообщения</PageHeader>
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
