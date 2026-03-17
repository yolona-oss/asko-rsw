'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Modal, Button } from '@asko/ui';

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const INITIAL_CROP_SIZE = 256;
const MIN_CROP_SIZE = 80;
const MAX_CROP_SIZE = 400;
const CONTAINER_SIZE = 420; // viewport container (must be >= MAX_CROP_SIZE)
const OUTPUT_SIZE = 512;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const HANDLE_SIZE = 14; // corner handle hit-area
const HANDLE_VISUAL = 10; // visible square size

type DragMode = 'none' | 'pan' | 'resize';
type Corner = 'tl' | 'tr' | 'bl' | 'br';

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: AvatarCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(INITIAL_CROP_SIZE);

  const dragMode = useRef<DragMode>('none');
  const activeCorner = useRef<Corner | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ cropSize: 0, px: 0, py: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });

      const fitScale = INITIAL_CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Clamp offset so image covers the crop circle
  const clampOffset = useCallback(
    (ox: number, oy: number, s: number, cs: number) => {
      if (!imgNatural.w) return { x: ox, y: oy };
      const halfCrop = cs / 2;
      const maxX = (imgNatural.w * s) / 2 - halfCrop;
      const maxY = (imgNatural.h * s) / 2 - halfCrop;
      return {
        x: Math.max(-Math.max(0, maxX), Math.min(Math.max(0, maxX), ox)),
        y: Math.max(-Math.max(0, maxY), Math.min(Math.max(0, maxY), oy)),
      };
    },
    [imgNatural],
  );

  // --- Pointer handlers ---

  const handlePointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Position relative to container center
    const px = e.clientX - rect.left - CONTAINER_SIZE / 2;
    const py = e.clientY - rect.top - CONTAINER_SIZE / 2;

    // Check if pointer is near a corner handle
    const half = cropSize / 2;
    const corners: { key: Corner; cx: number; cy: number }[] = [
      { key: 'tl', cx: -half, cy: -half },
      { key: 'tr', cx: half, cy: -half },
      { key: 'bl', cx: -half, cy: half },
      { key: 'br', cx: half, cy: half },
    ];

    const hitRadius = HANDLE_SIZE;
    for (const c of corners) {
      if (Math.abs(px - c.cx) < hitRadius && Math.abs(py - c.cy) < hitRadius) {
        dragMode.current = 'resize';
        activeCorner.current = c.key;
        resizeStart.current = { cropSize, px: e.clientX, py: e.clientY };
        lastPointer.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Otherwise: pan
    dragMode.current = 'pan';
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (dragMode.current === 'none') return;

    if (dragMode.current === 'pan') {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale, cropSize));
      return;
    }

    if (dragMode.current === 'resize') {
      const corner = activeCorner.current!;
      const dx = e.clientX - resizeStart.current.px;
      const dy = e.clientY - resizeStart.current.py;

      // Determine resize delta based on which corner is dragged
      // Positive delta = enlarging for br, negative for tl, etc.
      let delta: number;
      switch (corner) {
        case 'br':
          delta = Math.max(dx, dy);
          break;
        case 'bl':
          delta = Math.max(-dx, dy);
          break;
        case 'tr':
          delta = Math.max(dx, -dy);
          break;
        case 'tl':
          delta = Math.max(-dx, -dy);
          break;
      }

      const newCropSize = Math.round(
        Math.max(MIN_CROP_SIZE, Math.min(MAX_CROP_SIZE, resizeStart.current.cropSize + delta)),
      );
      setCropSize(newCropSize);
      setOffset((prev) => clampOffset(prev.x, prev.y, scale, newCropSize));
    }
  };

  const handlePointerUp = () => {
    dragMode.current = 'none';
    activeCorner.current = null;
  };

  // Wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.001));
        setOffset((o) => clampOffset(o.x, o.y, next, cropSize));
        return next;
      });
    },
    [clampOffset, cropSize],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // --- Confirm ---
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
    const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
    const srcSize = cropSize / scale;

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

  const half = cropSize / 2;

  // Corner positions relative to container center
  const corners: { key: Corner; cx: number; cy: number }[] = [
    { key: 'tl', cx: -half, cy: -half },
    { key: 'tr', cx: half, cy: -half },
    { key: 'bl', cx: -half, cy: half },
    { key: 'br', cx: half, cy: half },
  ];

  const cursorForCorner: Record<Corner, string> = {
    tl: 'nwse-resize',
    br: 'nwse-resize',
    tr: 'nesw-resize',
    bl: 'nesw-resize',
  };

  return (
    <Modal
      open={true}
      onClose={onCancel}
      className="flex flex-col items-center gap-6 p-6 w-[480px] max-w-[95vw]"
    >
      <h3 className="text-lg font-medium text-text-main">Выберите область</h3>

      {/* Crop viewport */}
      <div
        ref={containerRef}
        className="relative select-none touch-none overflow-hidden rounded-lg bg-black/20"
        style={{
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
          cursor: 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Image layer */}
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

        {/* Overlay mask with circle cutout */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_SIZE}
          height={CONTAINER_SIZE}
          viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}
        >
          <defs>
            <mask id="crop-circle-mask">
              <rect width={CONTAINER_SIZE} height={CONTAINER_SIZE} fill="white" />
              <circle
                cx={CONTAINER_SIZE / 2}
                cy={CONTAINER_SIZE / 2}
                r={cropSize / 2 - 1}
                fill="black"
              />
            </mask>
          </defs>

          {/* Semi-transparent overlay outside the circle */}
          <rect
            width={CONTAINER_SIZE}
            height={CONTAINER_SIZE}
            fill="rgba(0,0,0,0.55)"
            mask="url(#crop-circle-mask)"
          />

          {/* Circle border */}
          <circle
            cx={CONTAINER_SIZE / 2}
            cy={CONTAINER_SIZE / 2}
            r={cropSize / 2 - 1}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.7}
          />

          {/* Bounding rectangle (dashed) */}
          <rect
            x={CONTAINER_SIZE / 2 - half}
            y={CONTAINER_SIZE / 2 - half}
            width={cropSize}
            height={cropSize}
            fill="none"
            stroke="white"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        </svg>

        {/* Corner handles */}
        {corners.map((c) => {
          const left = CONTAINER_SIZE / 2 + c.cx;
          const top = CONTAINER_SIZE / 2 + c.cy;
          return (
            <div
              key={c.key}
              style={{
                position: 'absolute',
                left: left - HANDLE_SIZE / 2,
                top: top - HANDLE_SIZE / 2,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cursorForCorner[c.key],
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: HANDLE_VISUAL,
                  height: HANDLE_VISUAL,
                  backgroundColor: 'white',
                  border: '1.5px solid rgba(0,0,0,0.3)',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          );
        })}
      </div>

      <p className="text-sm text-text-sub text-center">
        Перетащите для перемещения, прокрутите для масштабирования, потяните за углы для изменения размера
      </p>

      {/* Actions */}
      <div className="flex gap-4 w-full">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Отмена
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}
