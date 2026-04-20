'use client';

import { useState } from 'react';
import { Modal, Button, FormField } from '@asko/ui';
import { X, CreditCard } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { requestWithdraw, resetWithdrawError } from '@/store/withdraw';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
}

function formatCardInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function maskCard(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 4) return digits;
  return `•••• ${digits.slice(-4)}`;
}

export function WithdrawModal({ open, onClose, maxAmount }: WithdrawModalProps) {
  const dispatch = useAppDispatch();
  const { requesting, error } = useAppSelector((s) => s.withdraw);
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleClose = () => {
    setAmount('');
    setCardNumber('');
    setCardHolderName('');
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
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 16 || digits.length > 19) {
      setLocalError('Введите корректный номер карты (16–19 цифр)');
      return;
    }
    if (!cardHolderName.trim()) {
      setLocalError('Введите имя владельца карты');
      return;
    }
    dispatch(requestWithdraw({ amount: num, cardNumber: digits, cardHolderName: cardHolderName.trim() })).then((result) => {
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
        <X className="w-6 h-6" />
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

        <FormField label="Номер карты" variant="bold">
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub" />
            <input
              type="text"
              inputMode="numeric"
              value={formatCardInput(cardNumber)}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0000 0000 0000 0000"
              maxLength={23}
              className="w-full border border-border-light pl-11 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-sub tracking-wider"
            />
          </div>
        </FormField>

        <FormField label="Имя владельца карты" variant="bold">
          <input
            type="text"
            value={cardHolderName}
            onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
            placeholder="IVAN IVANOV"
            className="w-full border border-border-light px-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-sub uppercase tracking-wider"
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
