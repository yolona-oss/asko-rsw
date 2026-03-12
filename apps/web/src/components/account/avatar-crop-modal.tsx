'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from 'react';

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const CROP_SIZE = 256; // diameter of the visible circle
const OUTPUT_SIZE = 512; // exported image size (px)
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: AvatarCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Load the image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });

      // Fit the image so the shortest side fills the crop circle
      const fitScale = CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Clamp offset so the image always covers the crop circle
  const clampOffset = useCallback(
    (ox: number, oy: number, s: number) => {
      if (!imgNatural.w) return { x: ox, y: oy };
      const halfCrop = CROP_SIZE / 2;
      const maxX = (imgNatural.w * s) / 2 - halfCrop;
      const maxY = (imgNatural.h * s) / 2 - halfCrop;
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [imgNatural],
  );

  const handlePointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    setDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  const handlePointerUp = () => setDragging(false);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.001));
        setOffset((o) => clampOffset(o.x, o.y, next));
        return next;
      });
    },
    [clampOffset],
  );

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate what part of the original image maps to the crop circle
    const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
    const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
    const srcSize = CROP_SIZE / scale;

    ctx.drawImage(
      img,
      srcCenterX - srcSize / 2,
      srcCenterY - srcSize / 2,
      srcSize,
      srcSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!imgNatural.w) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-sm shadow-lg flex flex-col items-center gap-6 p-6 w-[360px] max-w-[95vw]">
        <h3 className="text-lg font-medium text-text-main">Выберите область</h3>

        {/* Crop viewport */}
        <div
          ref={containerRef}
          className="relative select-none touch-none overflow-hidden"
          style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: dragging ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Image */}
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: imgNatural.w * scale,
              height: imgNatural.h * scale,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              pointerEvents: 'none',
              maxWidth: 'none',
            }}
          />

          {/* Circle mask overlay */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CROP_SIZE}
            height={CROP_SIZE}
            viewBox={`0 0 ${CROP_SIZE} ${CROP_SIZE}`}
          >
            <defs>
              <mask id="crop-mask">
                <rect width={CROP_SIZE} height={CROP_SIZE} fill="white" />
                <circle cx={CROP_SIZE / 2} cy={CROP_SIZE / 2} r={CROP_SIZE / 2 - 2} fill="black" />
              </mask>
            </defs>
            <rect
              width={CROP_SIZE}
              height={CROP_SIZE}
              fill="rgba(0,0,0,0.5)"
              mask="url(#crop-mask)"
            />
            <circle
              cx={CROP_SIZE / 2}
              cy={CROP_SIZE / 2}
              r={CROP_SIZE / 2 - 1}
              fill="none"
              stroke="white"
              strokeWidth={2}
            />
          </svg>
        </div>

        <p className="text-sm text-text-sub text-center">
          Перетащите для перемещения, прокрутите для масштабирования
        </p>

        {/* Actions */}
        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-main border border-border-light"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-red"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
