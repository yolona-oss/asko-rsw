'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthImageShell } from '@/components/auth/auth-image-shell';
import { TokenConfirmation } from '@/components/auth/token-confirmation';
import { authApi } from '@/lib/api/auth';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthImageShell>
      {(variant) => (
        <TokenConfirmation
          token={token}
          confirmFn={authApi.confirmEmail}
          loadingTitle="Подтверждение email"
          loadingText="Подтверждаем ваш email..."
          successTitle="Email подтверждён"
          successText="Ваш email успешно подтверждён."
          successButtonText="Перейти в аккаунт"
          successRedirect="/account"
          errorTitle="Ошибка подтверждения"
          errorHint="Ссылка могла истечь. Запросите новое письмо в настройках профиля."
          noTokenMessage="Токен подтверждения не найден"
          variant={variant}
        />
      )}
    </AuthImageShell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}
