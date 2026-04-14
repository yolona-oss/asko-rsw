'use client';

import { lazy, Suspense } from 'react';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const CreateRequest = lazy(() => import('@/components/account/requests/user/create').then(m => ({ default: m.CreateRequest })));

export default function CreateRequestPage() {
  return <Suspense fallback={<FormPageSkeleton />}><CreateRequest /></Suspense>;
}
