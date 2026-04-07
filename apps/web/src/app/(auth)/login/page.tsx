'use client';

import { lazy, Suspense } from 'react';
import { SkeletonBlock } from '@asko/ui';

const AuthImageShell = lazy(() =>
  import('@/components/auth/auth-image-shell').then((m) => ({ default: m.AuthImageShell })),
);
const LoginForm = lazy(() =>
  import('@/components/auth/login-form').then((m) => ({ default: m.LoginForm })),
);

function AuthSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <SkeletonBlock className="w-[400px] h-[500px]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthImageShell>
        {(variant) => <LoginForm variant={variant} />}
      </AuthImageShell>
    </Suspense>
  );
}
