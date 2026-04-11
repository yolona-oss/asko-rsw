'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TokenConfirmationProps {
  token: string | null;
  confirmFn: (token: string) => Promise<any>;
  loadingTitle: string;
  loadingText: string;
  successTitle: string;
  successText: string | ((data: any) => string);
  successButtonText: string;
  successRedirect: string;
  errorTitle: string;
  errorHint: string;
  noTokenMessage: string;
  variant: 'mobile' | 'desktop';
}

export function TokenConfirmation({
  token,
  confirmFn,
  loadingTitle,
  loadingText,
  successTitle,
  successText,
  successButtonText,
  successRedirect,
  errorTitle,
  errorHint,
  noTokenMessage,
  variant,
}: TokenConfirmationProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [responseData, setResponseData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setMessage(noTokenMessage);
      return;
    }

    confirmFn(token)
      .then((res) => {
        setStatus('success');
        setResponseData(res?.data);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message ?? errorHint);
      });
  }, [token]);

  const labelColor = variant === 'mobile' ? 'text-text-on-dark' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-text-muted' : 'text-text-sub';
  const errorBg = variant === 'mobile' ? 'bg-brand-red/80' : 'bg-brand-red';

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-6">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          {loadingTitle}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin text-brand-red" />
          <p className={`text-sm ${subColor}`}>{loadingText}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    const resolvedText = typeof successText === 'function'
      ? successText(responseData)
      : successText;

    return (
      <div className="flex flex-col gap-6">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          {successTitle}
        </p>
        <p className={`text-sm ${subColor}`}>{resolvedText}</p>
        <button
          type="button"
          onClick={() => router.push(successRedirect)}
          className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer`}
        >
          {successButtonText}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
        {errorTitle}
      </p>
      <div className={`px-3 py-2 text-sm text-text-on-brand ${errorBg}`}>{message}</div>
      <p className={`text-sm ${subColor}`}>{errorHint}</p>
      <Link
        href="/login"
        className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer"
      >
        Войти
      </Link>
    </div>
  );
}
