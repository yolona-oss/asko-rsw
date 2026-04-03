'use client';

import { useState } from 'react';
import { Modal, Button, FormField } from '@asko/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import { requestWithdraw, resetWithdrawError } from '@/store/withdraw-slice';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
}

export function WithdrawModal({ open, onClose, maxAmount }: WithdrawModalProps) {
  const dispatch = useAppDispatch();
  const { requesting, error } = useAppSelector((s) => s.withdraw);
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');

  const handleClose = () => {
    setAmount('');
    setLocalError('');
    dispatch(resetWithdrawError());
    onClose();
  };

  const handleSubmit = () => {
    setLocalError('');
    const num = parseInt(amount, 10);
    if (!num || num <= 0 || !Number.isInteger(num)) {
      setLocalError('Введите целое число баллов');
      return;
    }
    if (num > maxAmount) {
      setLocalError(`Максимальная сумма: ${maxAmount.toLocaleString('ru-RU')} баллов`);
      return;
    }
    dispatch(requestWithdraw(num)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={handleClose} className="w-full max-w-[500px] p-6 lg:p-8">
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-text-sub hover:text-text-main"
        aria-label="Закрыть"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-xl lg:text-2xl font-bold text-text-main">Вывод средств</h2>
      <p className="text-sm text-text-sub mt-1">
        Доступно для вывода: {maxAmount.toLocaleString('ru-RU')} баллов
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <FormField label="Сумма вывода" variant="bold">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={1}
            max={maxAmount}
            className="w-full border border-border-light px-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-sub"
          />
        </FormField>

        {(localError || error) && (
          <p className="text-sm text-brand-red">{localError || error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={requesting}
          className="w-full"
        >
          {requesting ? 'Обработка...' : 'Запросить вывод'}
        </Button>
      </div>
    </Modal>
  );
}
