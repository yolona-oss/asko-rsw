'use client';

import { useState, useRef } from 'react';
import { Button, Modal, Textarea, FormField } from '@asko/ui';
import { Download } from 'lucide-react';
import { repairRequestApi } from '@/lib/api/repair-request';
import { getDocumentUrl } from '@/lib/file-url';
import { SigningOtpForm } from '@/components/account/shared/signing-otp-form';

type Step = 'edit' | 'generated' | 'digital' | 'offline' | 'done';

interface AvrModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  onCompleted: () => void;
}

export function AvrModal({ open, onClose, requestId, onCompleted }: AvrModalProps) {
  const [step, setStep] = useState<Step>('edit');
  const [completionNote, setCompletionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avrDocumentId, setAvrDocumentId] = useState('');

  // Digital signing state
  const [signingChannel, setSigningChannel] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  // Offline state
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await repairRequestApi.generateAvr(requestId, {
        completionNote: completionNote.trim() || undefined,
      });
      setAvrDocumentId(data.avrDocumentId);
      setStep('generated');
    } catch {
      setError('Не удалось сформировать акт');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError('');
    try {
      await repairRequestApi.resetAvr(requestId);
      setAvrDocumentId('');
      setStep('edit');
    } catch {
      setError('Не удалось сбросить акт');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateDigital = async () => {
    setOtpSending(true);
    setError('');
    try {
      const { data } = await repairRequestApi.initiateAvrSigning(requestId);
      setSigningChannel(data.channel);
      setMaskedTarget(data.maskedTarget);
      setRetryAfter(data.retryAfter);
      setStep('digital');
    } catch {
      setError('Не удалось отправить код');
    } finally {
      setOtpSending(false);
    }
  };

  const handleUploadScan = async () => {
    if (!scanFile) return;
    setUploading(true);
    setError('');
    try {
      await repairRequestApi.uploadAvrScan(requestId, scanFile);
      setStep('done');
      onCompleted();
    } catch {
      setError('Не удалось загрузить подписанный акт');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (step !== 'done') {
      setStep('edit');
      setError('');
    }
    onClose();
  };

  const downloadUrl = avrDocumentId
    ? getDocumentUrl(avrDocumentId)
    : undefined;

  return (
    <Modal open={open} onClose={handleClose} className="w-full max-w-lg p-5 sm:p-6">
      {step === 'edit' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-text-main">Акт выполненных работ</h2>
          <p className="text-[13px] sm:text-sm text-text-sub">
            Сформируйте акт с данными о ремонте. При необходимости добавьте заключение.
          </p>
          <FormField label="Заключение (необязательно)">
            <Textarea
              value={completionNote}
              onChange={e => setCompletionNote(e.target.value)}
              placeholder="Описание выполненных работ, замечания..."
              rows={3}
            />
          </FormField>
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={handleGenerate} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? 'Формирование...' : 'Сформировать акт'}
            </Button>
            <Button variant="secondary" onClick={handleClose} className="flex-1 sm:flex-none">Отмена</Button>
          </div>
        </div>
      )}

      {step === 'generated' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-text-main">Акт сформирован</h2>
          <p className="text-[13px] sm:text-sm text-text-sub">
            Акт выполненных работ готов. Выберите способ подписания.
          </p>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
            >
              <Download className="w-4 h-4" />
              Скачать PDF
            </a>
          )}
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={handleInitiateDigital} disabled={otpSending} className="w-full">
              {otpSending ? 'Отправка кода...' : 'Цифровая подпись'}
            </Button>
            <Button variant="secondary" onClick={() => setStep('offline')} className="w-full">
              Подписать на бумаге
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={loading} className="w-full">
              Переформировать
            </Button>
          </div>
        </div>
      )}

      {step === 'digital' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-text-main">Цифровая подпись</h2>
          <SigningOtpForm
            requestId={requestId}
            channel={signingChannel}
            maskedTarget={maskedTarget}
            initialRetryAfter={retryAfter}
            onSuccess={() => { setStep('done'); onCompleted(); }}
            onError={setError}
          />
          <Button variant="ghost" onClick={() => setStep('generated')} className="self-start">
            Назад
          </Button>
        </div>
      )}

      {step === 'offline' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-text-main">Подписание на бумаге</h2>
          <p className="text-[13px] sm:text-sm text-text-sub">
            Скачайте и распечатайте акт. После подписания клиентом загрузите фото или скан подписанного документа.
          </p>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
            >
              <Download className="w-4 h-4" />
              Скачать PDF для печати
            </a>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setScanFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-border-light p-4 text-sm text-text-sub hover:border-brand-red transition-colors text-center cursor-pointer"
            >
              {scanFile ? scanFile.name : 'Нажмите для выбора файла'}
            </button>
          </div>
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={handleUploadScan} disabled={!scanFile || uploading} className="flex-1 sm:flex-none">
              {uploading ? 'Загрузка...' : 'Загрузить подписанный акт'}
            </Button>
            <Button variant="ghost" onClick={() => setStep('generated')} className="flex-1 sm:flex-none">
              Назад
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-success-deep">Акт подписан</h2>
          <p className="text-[13px] sm:text-sm text-text-sub">
            Акт выполненных работ подписан. Заявка завершена.
          </p>
          <Button variant="primary" onClick={handleClose}>Закрыть</Button>
        </div>
      )}
    </Modal>
  );
}
