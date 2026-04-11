'use client';

import { Modal, Button, FormField, Input } from '@asko/ui';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PatternSlot } from './types';

interface SlotPopoverProps {
  open: boolean;
  index: number;
  slot: PatternSlot | null;
  defaultStart: string;
  defaultEnd: string;
  onClose: () => void;
  onSave: (slot: PatternSlot) => void;
}

export function SlotPopover({ open, index, slot, defaultStart, defaultEnd, onClose, onSave }: SlotPopoverProps) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  useEffect(() => {
    if (!open) return;
    setStart(slot?.startTime || defaultStart);
    setEnd(slot?.endTime || defaultEnd);
  }, [open, slot, defaultStart, defaultEnd]);

  const isWork = !!slot?.work;

  const handleMakeWork = () => {
    onSave({ work: true, startTime: null, endTime: null });
    onClose();
  };

  const handleMakeRest = () => {
    onSave({ work: false, startTime: null, endTime: null });
    onClose();
  };

  const handleSaveTimes = () => {
    const startOverride = start === defaultStart ? null : start;
    const endOverride = end === defaultEnd ? null : end;
    onSave({ work: true, startTime: startOverride, endTime: endOverride });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-sm p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-text-main mb-4">
        День цикла №{index + 1}
      </h2>

      {isWork ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-[13px] sm:text-sm text-text-sub">
            По умолчанию {defaultStart}—{defaultEnd}. Укажите индивидуальное время или оставьте как есть.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Начало">
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </FormField>
            <FormField label="Конец">
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </FormField>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleSaveTimes}>
              Сохранить
            </Button>
            <Button variant="secondary" size="sm" onClick={handleMakeRest}>
              <Trash2 className="w-4 h-4 mr-1" />
              Сделать выходным
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-[13px] sm:text-sm text-text-sub">Этот день сейчас выходной.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleMakeWork}>
              Сделать рабочим
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
