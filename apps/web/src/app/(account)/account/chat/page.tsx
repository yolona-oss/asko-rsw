'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { ChatLayout } from '@/components/chat/chat-layout';
import { SkeletonBlock } from '@/components/skeleton';
import { PageHeader } from '@/components/account/page-header';

function ChatSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-initial lg:p-8 lg:gap-8">
      <SkeletonBlock className="h-8 w-32 hidden lg:block" />
      <SkeletonBlock className="flex-1 lg:flex-none lg:h-[calc(100vh-180px)] w-full" />
    </div>
  );
}

function ChatPageInner() {
  const { user } = useAccount();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversation') ?? undefined;

  if (!user) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-initial lg:p-8 lg:gap-8">
      <ChatLayout currentUserId={user.id} initialConversationId={initialConversationId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <PageHeader className="opacity-0">pu pu pu</PageHeader>
      <ChatPageInner />
    </Suspense>
  );
}
