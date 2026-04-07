'use client';

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SkeletonBlock } from '@asko/ui';

const AuthImageShell = lazy(() =>
  import('@/components/auth/auth-image-shell').then((m) => ({ default: m.AuthImageShell })),
);
const RequestResetForm = lazy(() =>
  import('@/components/auth/request-reset-form').then((m) => ({ default: m.RequestResetForm })),
);
const ResetPasswordForm = lazy(() =>
  import('@/components/auth/reset-password-form').then((m) => ({ default: m.ResetPasswordForm })),
);

function AuthSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <SkeletonBlock className="w-[400px] h-[500px]" />
    </div>
  );
}

function ResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthImageShell>
      {(variant) =>
        token
          ? <ResetPasswordForm variant={variant} token={token} />
          : <RequestResetForm variant={variant} />
      }
    </AuthImageShell>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetContent />
    </Suspense>
  );
}
