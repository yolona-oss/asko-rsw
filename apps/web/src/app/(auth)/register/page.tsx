'use client';

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SkeletonBlock } from '@asko/ui';

const AuthImageShell = lazy(() =>
  import('@/components/auth/auth-image-shell').then((m) => ({ default: m.AuthImageShell })),
);
const RegisterForm = lazy(() =>
  import('@/components/auth/register-form').then((m) => ({ default: m.RegisterForm })),
);

function AuthSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <SkeletonBlock className="w-[400px] h-[500px]" />
    </div>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const prefillEmail = searchParams.get('email') ?? '';

  return (
    <AuthImageShell>
      {(variant) => (
        <RegisterForm
          variant={variant}
          inviteToken={inviteToken}
          prefillEmail={prefillEmail}
        />
      )}
    </AuthImageShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterContent />
    </Suspense>
  );
}
