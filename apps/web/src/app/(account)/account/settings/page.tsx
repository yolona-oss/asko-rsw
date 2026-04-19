'use client';

import { lazy, Suspense } from 'react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';

const NotificationSettings = lazy(() =>
  import('@/components/account/notifications/notification-settings').then(m => ({
    default: m.NotificationSettings,
  })),
);

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader>Настройки уведомлений</PageHeader>
      <Suspense fallback={
        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 bg-skeleton animate-pulse" />
          <div className="h-64 bg-skeleton animate-pulse" />
        </div>
      }>
        <NotificationSettings />
      </Suspense>
    </PageContainer>
  );
}
