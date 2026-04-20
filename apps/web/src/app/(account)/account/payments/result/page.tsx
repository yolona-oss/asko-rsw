'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PaymentResultPage() {
  const router = useRouter();

  useEffect(() => {
    const returnUrl = sessionStorage.getItem('payment_return_url');
    sessionStorage.removeItem('payment_return_url');

    // Small delay to let the user see the page briefly
    const t = setTimeout(() => {
      if (returnUrl) {
        // Use replace so the result page doesn't stay in history
        window.location.replace(returnUrl);
      } else {
        router.replace('/account/payments');
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      <p className="text-lg font-medium text-text-main">Платёж обработан</p>
      <p className="text-sm text-text-sub">Перенаправление...</p>
    </div>
  );
}
