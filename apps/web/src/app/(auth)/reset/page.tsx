'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthImageShell } from '@/components/auth/auth-image-shell';
import { RequestResetForm } from '@/components/auth/request-reset-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

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
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}
