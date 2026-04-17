'use client';

import { useState } from 'react';
import { Badge, Button, Card } from '@asko/ui';
import { AvrStatus } from '@asko/shared/client';
import { Download, FileCheck, FileClock, FileX, FileMinus, AlertTriangle, Trash2 } from 'lucide-react';
import { openDocument } from '@/lib/file-url';

interface AvrStatusCardProps {
  avrStatus?: string;
  avrDocumentId?: string;
  avrSignedDocumentId?: string;
  avrSigningMethod?: string;
  avrSignedAt?: string;
  onRemove?: () => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'error'; icon: typeof FileCheck }> = {
  [AvrStatus.NONE]: { label: 'Не сформирован', variant: 'neutral', icon: FileMinus },
  [AvrStatus.GENERATED]: { label: 'Сформирован', variant: 'warning', icon: FileClock },
  [AvrStatus.PENDING_SIGNATURE]: { label: 'Ожидает подписи', variant: 'warning', icon: FileClock },
  [AvrStatus.SIGNED_DIGITAL]: { label: 'Подписан (ЭП)', variant: 'success', icon: FileCheck },
  [AvrStatus.SIGNED_OFFLINE]: { label: 'Подписан (бумажный)', variant: 'success', icon: FileCheck },
};

export function AvrStatusCard({ avrStatus, avrDocumentId, avrSignedDocumentId, avrSigningMethod, avrSignedAt, onRemove }: AvrStatusCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const config = avrStatus ? STATUS_CONFIG[avrStatus] : undefined;

  if (!config) {
    return (
      <Card padding="none" className="p-3 sm:p-4 flex flex-col gap-2 border-error-border bg-error-bg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-error shrink-0" />
          <span className="text-[13px] sm:text-sm font-medium text-text-main">Акт выполненных работ</span>
          <Badge variant="error">Ошибка</Badge>
        </div>
        <p className="text-[12px] sm:text-sm text-error-deep">
          Статус акта неизвестен{avrStatus ? ` (${avrStatus})` : ''}. Обратитесь в поддержку.
        </p>
      </Card>
    );
  }

  const Icon = config.icon;
  const isNone = avrStatus === AvrStatus.NONE;
  const canRemove = onRemove && !isNone;
  const signedDate = avrSignedAt ? new Date(avrSignedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <Card padding="none" className="p-3 sm:p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon className="w-4 h-4 text-text-sub shrink-0" />
        <span className="text-[13px] sm:text-sm font-medium text-text-main">Акт выполненных работ</span>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {isNone && (
        <p className="text-[12px] sm:text-sm text-text-sub">Акт будет сформирован после выполнения ремонта</p>
      )}

      {signedDate && (
        <p className="text-[12px] sm:text-sm text-text-sub">Подписан: {signedDate}</p>
      )}

      {!isNone && (
        <div className="flex items-center gap-3 flex-wrap">
          {avrDocumentId && (
            <button
              type="button"
              onClick={() => openDocument(avrDocumentId)}
              className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-brand-red hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Скачать акт
            </button>
          )}
          {avrSignedDocumentId && avrSigningMethod === 'offline' && (
            <button
              type="button"
              onClick={() => openDocument(avrSignedDocumentId)}
              className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-text-sub hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Подписанный скан
            </button>
          )}
          {!avrDocumentId && (
            <span className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-error">
              <FileX className="w-3.5 h-3.5" />
              Документ не прикреплён
            </span>
          )}
        </div>
      )}

      {canRemove && !confirmRemove && (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm text-error hover:underline cursor-pointer self-start"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Удалить акт
        </button>
      )}

      {canRemove && confirmRemove && (
        <div className="flex items-center gap-2 text-[13px] sm:text-sm">
          <span className="text-text-sub">Удалить акт?</span>
          <Button variant="danger" size="sm" onClick={handleRemove} disabled={removing}>
            {removing ? 'Удаление…' : 'Да, удалить'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmRemove(false)} disabled={removing}>
            Отмена
          </Button>
        </div>
      )}
    </Card>
  );
}
