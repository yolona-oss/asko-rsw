'use client';

import { useEffect, useState } from 'react';
import { Modal, SkeletonBlock } from '@asko/ui';
import { Loader2, X, FlaskConical, CreditCard, Landmark, Banknote } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPaymentOptions, createPayment, resetPayment } from '@/store/payment';
import { PaymentTargetType } from '@asko/shared/client';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'repairRequest' | 'certificate';
  targetId: string;
  amount: number;
  requestNumber?: string;
}

const TARGET_TYPE_MAP: Record<string, PaymentTargetType> = {
  repairRequest: PaymentTargetType.REPAIR_REQUEST,
  certificate: PaymentTargetType.CERTIFICATE,
};

const PROVIDER_LABELS: Record<string, string> = {
  dummy: 'Тестовая оплата',
  yookassa: 'ЮKassa',
  tbank: 'Т-Банк',
  card: 'Оплата картой',
  cash: 'Наличные',
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  dummy: <FlaskConical className="w-8 h-8" />,
  yookassa: <CreditCard className="w-8 h-8" />,
  tbank: <Landmark className="w-8 h-8" />,
  card: <CreditCard className="w-8 h-8" />,
  cash: <Banknote className="w-8 h-8" />,
};

const PROVIDER_COLORS: Record<string, string> = {
  dummy: 'bg-brand-red text-text-on-brand',
  yookassa: 'bg-dark text-text-on-dark',
  tbank: 'bg-dark text-text-on-dark',
  card: 'bg-transparent border border-border-light text-text-main',
  cash: 'bg-success text-text-on-dark',
};

export function PaymentModal({
  open,
  onClose,
  targetType,
  targetId,
  amount,
  requestNumber,
}: PaymentModalProps) {
  const dispatch = useAppDispatch();
  const { options, optionsLoading, creating, result, error } = useAppSelector((s) => s.payment);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchPaymentOptions());
      dispatch(resetPayment());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProvider(null);
    }
  }, [open, dispatch]);

  // Set default provider when options load
  useEffect(() => {
    if (options && !selectedProvider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProvider(options.defaultProvider);
    }
  }, [options, selectedProvider]);

  useEffect(() => {
    if (!result) return;
    if (result.redirectUrl && !result.redirectUrl.startsWith('dummy-checkout://')) {
      sessionStorage.setItem('payment_return_url', window.location.href);
      window.location.assign(result.redirectUrl);
      return;
    }
    if (result.status === 'paid') {
      onClose();
      return;
    }
    if (result.status === 'pending') {
      if (selectedProvider === 'cash') {
        // Don't auto-close — user needs to see and remember the confirmation code
        return;
      }
      // Dummy webhook fires at ≤4s; add a small buffer for DB + notification hop.
      const t = setTimeout(() => onClose(), 5500);
      return () => clearTimeout(t);
    }
  }, [result, onClose, selectedProvider]);

  const handlePay = () => {
    if (!selectedProvider) return;
    dispatch(createPayment({
      targetType: TARGET_TYPE_MAP[targetType] ?? targetType as PaymentTargetType,
      targetId,
      amount,
      provider: selectedProvider as any,
    }));
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-[600px] p-6 lg:p-8">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-text-sub hover:text-text-main"
        aria-label="Закрыть"
      >
        <X className="w-6 h-6" />
      </button>

      <h2 className="text-xl lg:text-2xl font-bold text-text-main">
        Оплата{requestNumber ? ` заявки №${requestNumber}` : ''}
      </h2>
      <p className="text-sm text-text-sub mt-1">
        Сумма к оплате: {amount.toLocaleString('ru-RU')} ₽
      </p>

      {/* Provider selection */}
      {optionsLoading ? (
        <div className="flex flex-col gap-3 mt-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}</div>
      ) : options ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {options.providers
          .filter((p) => !(targetType === 'certificate' && p === 'cash'))
          .map((provider) => {
            const isSelected = provider === selectedProvider;
            return (
              <button
                key={provider}
                type="button"
                onClick={() => setSelectedProvider(provider)}
                className={`flex flex-col items-center gap-3 p-4 border-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-brand-red bg-primary-50'
                    : 'border-border-light/30 hover:border-text-sub'
                }`}
              >
                <div className="w-full aspect-[4/3] bg-surface-muted flex items-center justify-center text-text-sub">
                  {PROVIDER_ICONS[provider] ?? <CreditCard className="w-8 h-8" />}
                </div>
                <span className="text-sm font-medium text-text-main text-center">
                  {PROVIDER_LABELS[provider] ?? provider}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Error */}
      {error && <p className="text-sm text-brand-red mt-4">{error}</p>}

      {/* Pending confirmation state (dummy provider async webhook) */}
      {result?.status === 'pending' ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-6">
          {selectedProvider === 'cash' ? (
            <>
              <p className="text-sm font-medium text-text-main">Оплата наличными зарегистрирована</p>
              {result.cashConfirmCode && (
                <div className="flex flex-col items-center gap-2 py-3 px-6 bg-surface-secondary border border-border">
                  <p className="text-xs text-text-sub">Код подтверждения для сотрудника:</p>
                  <p className="text-3xl font-bold text-text-main tracking-[0.3em] select-all">{result.cashConfirmCode}</p>
                  <p className="text-xs text-text-sub text-center">Назовите этот код мастеру или менеджеру при передаче наличных</p>
                </div>
              )}
              <p className="text-xs text-text-sub text-center max-w-[320px]">
                Мастер или менеджер подтвердит получение оплаты. Статус платежа обновится автоматически.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
              <p className="text-sm font-medium text-text-main">Ожидание подтверждения оплаты</p>
              <p className="text-xs text-text-sub text-center max-w-[320px]">
                Платёжная система обрабатывает транзакцию. Окно закроется автоматически.
              </p>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePay}
          disabled={!selectedProvider || creating}
          className={`w-full mt-6 py-3 text-sm font-medium cursor-pointer transition-colors ${
            selectedProvider && !creating
              ? (PROVIDER_COLORS[selectedProvider] || 'bg-brand-red text-text-on-brand')
              : 'bg-border-light text-text-sub cursor-not-allowed'
          }`}
        >
          {creating ? 'Обработка...' : selectedProvider === 'cash' ? 'Оплатить наличными' : 'Оплатить'}
        </button>
      )}
    </Modal>
  );
}
