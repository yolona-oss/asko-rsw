'use client';

import { AuthImageShell } from '@/components/auth/auth-image-shell';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <AuthImageShell>
      {(variant) => <LoginForm variant={variant} />}
    </AuthImageShell>
  );
}
