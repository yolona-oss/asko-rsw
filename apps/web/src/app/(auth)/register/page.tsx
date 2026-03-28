'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthImageShell } from '@/components/auth/auth-image-shell';
import { RegisterForm } from '@/components/auth/register-form';

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
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
