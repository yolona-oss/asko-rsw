'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthImageShell } from '@/components/auth/auth-image-shell';
import { TokenConfirmation } from '@/components/auth/token-confirmation';
import { authApi } from '@/lib/api/auth';

function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthImageShell>
      {(variant) => (
        <TokenConfirmation
          token={token}
          confirmFn={authApi.confirmEmailChange}
          loadingTitle="Смена email"
          loadingText="Подтверждаем смену email..."
          successTitle="Email изменён"
          successText={(data) => data?.message ?? 'Email успешно изменён.'}
          successButtonText="Перейти в аккаунт"
          successRedirect="/account"
          errorTitle="Ошибка"
          errorHint="Ссылка могла истечь. Попробуйте запросить смену email повторно в настройках профиля."
          noTokenMessage="Токен не найден"
          variant={variant}
        />
      )}
    </AuthImageShell>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense>
      <ConfirmEmailChangeContent />
    </Suspense>
  );
}
