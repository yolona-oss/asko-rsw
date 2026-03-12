'use client';

import { useEffect } from 'react';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  requestNumber?: string;
  amount?: number;
}

const PAYMENT_METHODS = [
  { id: 'sbp', label: 'Оплатить СБП', color: 'bg-brand-red text-white' },
  { id: 'card', label: 'Оплата картой', color: 'bg-dark text-white' },
  { id: 'mts', label: 'МТС БАНК', color: 'bg-dark text-white' },
  { id: 'other', label: 'Другие банки', color: 'bg-transparent border border-border-light text-text-main' },
] as const;

export function PaymentModal({
  open,
  onClose,
  requestNumber = '1234',
  amount = 14600,
}: PaymentModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-sm w-full max-w-[600px] mx-4 p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-sub hover:text-text-main"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl lg:text-2xl font-bold text-text-main">
          Оплата заявки №{requestNumber}
        </h2>
        <p className="text-sm text-text-sub mt-1">
          Сумма к оплате: {amount.toLocaleString('ru-RU')} ₽
        </p>

        {/* Payment methods grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {PAYMENT_METHODS.map((method) => (
            <div key={method.id} className="flex flex-col items-center gap-3">
              <div className="w-full aspect-[4/3] bg-[#F5F5F5] rounded-sm border border-border-light flex items-center justify-center">
                <span className="text-xs text-text-sub">{method.label}</span>
              </div>
              <span className="text-sm font-medium text-text-main text-center">
                {method.label}
              </span>
              <button
                type="button"
                className={`px-5 py-2 text-sm font-medium rounded-sm cursor-pointer ${method.color}`}
              >
                Выбрать
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
