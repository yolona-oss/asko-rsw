'use client';

import { CropModal } from '@asko/ui';

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: AvatarCropModalProps) {
  return (
    <CropModal
      imageSrc={imageSrc}
      onConfirm={onConfirm}
      onCancel={onCancel}
      shape="circle"
      outputWidth={512}
      cropWidth={256}
      minCropSize={80}
      maxCropSize={400}
      title="Выберите область"
    />
  );
}
