'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@asko/ui';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPaymentOptions, createPayment, resetPayment } from '@/store/payment-slice';
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
};

const PROVIDER_COLORS: Record<string, string> = {
  dummy: 'bg-brand-red text-white',
  yookassa: 'bg-dark text-white',
  tbank: 'bg-dark text-white',
  card: 'bg-transparent border border-border-light text-text-main',
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

  // Handle payment result
  useEffect(() => {
    if (result) {
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
      } else if (result.status === 'paid') {
        onClose();
      }
    }
  }, [result, onClose]);

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
        <p className="text-sm text-text-sub mt-6">Загрузка способов оплаты...</p>
      ) : options ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {options.providers.map((provider) => {
            const isSelected = provider === selectedProvider;
            return (
              <button
                key={provider}
                type="button"
                onClick={() => setSelectedProvider(provider)}
                className={`flex flex-col items-center gap-3 p-4 border-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-brand-red bg-[#FFF5F5]'
                    : 'border-border-light/30 hover:border-text-sub'
                }`}
              >
                <div className="w-full aspect-[4/3] bg-[#F5F5F5] flex items-center justify-center">
                  <span className="text-xs text-text-sub text-center px-1">
                    {PROVIDER_LABELS[provider] ?? provider}
                  </span>
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

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!selectedProvider || creating}
        className={`w-full mt-6 py-3 text-sm font-medium cursor-pointer transition-colors ${
          selectedProvider && !creating
            ? (PROVIDER_COLORS[selectedProvider] || 'bg-brand-red text-white')
            : 'bg-gray-200 text-text-sub cursor-not-allowed'
        }`}
      >
        {creating ? 'Обработка...' : 'Оплатить'}
      </button>
    </Modal>
  );
}
