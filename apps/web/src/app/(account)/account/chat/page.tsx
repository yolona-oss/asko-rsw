'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { ChatLayout } from '@/components/chat/chat-layout';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonBlock } from '@/components/skeleton';

function ChatSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-[calc(100vh-180px)] w-full" />
    </PageContainer>
  );
}

function ChatPageInner() {
  const { stage, user } = useAccount();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversation') ?? undefined;

  if (stage === 'skeleton' || !user) {
    return <ChatSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader>Чат</PageHeader>
      <ChatLayout currentUserId={user.id} initialConversationId={initialConversationId} />
    </PageContainer>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageInner />
    </Suspense>
  );
}
