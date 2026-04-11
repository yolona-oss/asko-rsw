'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Modal } from './modal';
import { Button } from './button';

// ─── Types ──────────────────────────────────────────────────────────────

export type CropShape = 'circle' | 'rectangle';

export interface CropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  /** 'circle' for avatars, 'rectangle' for images. Default: 'rectangle' */
  shape?: CropShape;
  /** Output width in px. Default: 800 */
  outputWidth?: number;
  /** Output height in px. Default: 600. Ignored for circle (uses outputWidth). */
  outputHeight?: number;
  /** Initial visible crop area width. Default: 360 */
  cropWidth?: number;
  /** Initial visible crop area height. Default: 270. Ignored for circle (uses cropWidth). */
  cropHeight?: number;
  /** Min crop size (shortest side). Default: 80 */
  minCropSize?: number;
  /** Max crop size (longest side). Default: 400 */
  maxCropSize?: number;
  /** Viewport container size. Default: 420 */
  containerSize?: number;
  /** Title text. Default: 'Обрезка изображения' */
  title?: string;
  /** JPEG quality 0-1. Default: 0.92 */
  quality?: number;
  /**
   * Keep crop corners inside the image: prevents resize/zoom from extending
   * the crop past the image bounds and enables edge-magnet snapping on corners.
   * Default: true.
   */
  constrainToImage?: boolean;
  /** Snap distance (screen px) for corner → image edge magnets. Default: 12 */
  magnetThreshold?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const HANDLE_SIZE = 14;
const HANDLE_VISUAL = 10;

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type DragMode = 'none' | 'pan' | 'resize';

// ─── Component ──────────────────────────────────────────────────────────

export function CropModal({
  imageSrc,
  onConfirm,
  onCancel,
  shape = 'rectangle',
  outputWidth = 800,
  outputHeight = 600,
  cropWidth: initialCropW = 360,
  cropHeight: initialCropH = 270,
  minCropSize = 80,
  maxCropSize = 400,
  containerSize = 420,
  title = 'Обрезка изображения',
  quality = 0.92,
  constrainToImage = true,
  magnetThreshold = 12,
}: CropModalProps) {
  const isCircle = shape === 'circle';
  const outW = outputWidth;
  const outH = isCircle ? outputWidth : outputHeight;
  const ratio = isCircle ? 1 : outW / outH;

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropW, setCropW] = useState(isCircle ? initialCropW : initialCropW);
  const [cropH, setCropH] = useState(isCircle ? initialCropW : initialCropH);

  const dragMode = useRef<DragMode>('none');
  const activeCorner = useRef<Corner | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ w: 0, h: 0, px: 0, py: 0 });

  const containerH = isCircle ? containerSize : containerSize * (cropH / cropW);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      if (isCircle) {
        const fitScale = initialCropW / Math.min(img.naturalWidth, img.naturalHeight);
        setScale(fitScale);
      } else {
        const fitScale = Math.max(initialCropW / img.naturalWidth, initialCropH / img.naturalHeight);
        setScale(fitScale);
      }
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Clamp offset so image covers the crop area
  const clampOffset = useCallback(
    (ox: number, oy: number, s: number, cw: number, ch: number) => {
      if (!imgNatural.w) return { x: ox, y: oy };
      const maxX = (imgNatural.w * s) / 2 - cw / 2;
      const maxY = (imgNatural.h * s) / 2 - ch / 2;
      return {
        x: Math.max(-Math.max(0, maxX), Math.min(Math.max(0, maxX), ox)),
        y: Math.max(-Math.max(0, maxY), Math.min(Math.max(0, maxY), oy)),
      };
    },
    [imgNatural],
  );

  // Max crop dimensions (screen px). The crop is center-anchored, but the
  // image is freely pannable, so the crop can grow up to the full image
  // display size — clampOffset auto-shifts the image after each resize to
  // keep it covering the enlarged crop. (A tighter offset-aware cap would
  // lock the crop whenever one image edge touched the crop, even if there
  // was room on the opposite side.)
  const getMaxCropDims = useCallback(
    (s: number) => ({
      maxW: Math.max(0, imgNatural.w * s),
      maxH: Math.max(0, imgNatural.h * s),
    }),
    [imgNatural],
  );

  // Resize crop area with aspect ratio lock
  const resizeCrop = useCallback(
    (delta: number) => {
      let effectiveMaxW = maxCropSize;
      let effectiveMaxH = maxCropSize;
      if (constrainToImage) {
        const { maxW, maxH } = getMaxCropDims(scale);
        effectiveMaxW = Math.min(maxCropSize, maxW);
        effectiveMaxH = Math.min(maxCropSize, maxH);
      }

      let newW: number;
      let newH: number;

      if (isCircle) {
        const cap = Math.max(minCropSize, Math.min(effectiveMaxW, effectiveMaxH));
        newW = Math.round(Math.max(minCropSize, Math.min(cap, resizeStart.current.w + delta)));
        if (
          constrainToImage &&
          cap - newW <= magnetThreshold &&
          cap >= minCropSize + magnetThreshold
        ) {
          newW = Math.round(cap);
        }
        newH = newW;
      } else {
        // Aspect-locked: both width-budget and height-budget (converted to width) apply
        const cap = Math.max(minCropSize, Math.min(effectiveMaxW, effectiveMaxH * ratio));
        newW = Math.round(Math.max(minCropSize, Math.min(cap, resizeStart.current.w + delta)));
        if (
          constrainToImage &&
          cap - newW <= magnetThreshold &&
          cap >= minCropSize + magnetThreshold
        ) {
          newW = Math.round(cap);
        }
        newH = Math.round(newW / ratio);
      }

      setCropW(newW);
      setCropH(newH);
      setOffset((prev) => clampOffset(prev.x, prev.y, scale, newW, newH));
    },
    [
      isCircle,
      ratio,
      minCropSize,
      maxCropSize,
      clampOffset,
      scale,
      constrainToImage,
      magnetThreshold,
      getMaxCropDims,
    ],
  );

  // Pointer handlers
  const handlePointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const px = e.clientX - rect.left - containerSize / 2;
      const py = e.clientY - rect.top - containerH / 2;
      const halfW = cropW / 2;
      const halfH = cropH / 2;
      const corners: { key: Corner; cx: number; cy: number }[] = [
        { key: 'tl', cx: -halfW, cy: -halfH },
        { key: 'tr', cx: halfW, cy: -halfH },
        { key: 'bl', cx: -halfW, cy: halfH },
        { key: 'br', cx: halfW, cy: halfH },
      ];
      for (const c of corners) {
        if (Math.abs(px - c.cx) < HANDLE_SIZE && Math.abs(py - c.cy) < HANDLE_SIZE) {
          dragMode.current = 'resize';
          activeCorner.current = c.key;
          resizeStart.current = { w: cropW, h: cropH, px: e.clientX, py: e.clientY };
          lastPointer.current = { x: e.clientX, y: e.clientY };
          return;
        }
      }
    }

    dragMode.current = 'pan';
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (dragMode.current === 'none') return;

    if (dragMode.current === 'pan') {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale, cropW, cropH));
      return;
    }

    if (dragMode.current === 'resize') {
      const corner = activeCorner.current!;
      const dx = e.clientX - resizeStart.current.px;
      const dy = e.clientY - resizeStart.current.py;

      let delta: number;
      switch (corner) {
        case 'br': delta = Math.max(dx, dy); break;
        case 'bl': delta = Math.max(-dx, dy); break;
        case 'tr': delta = Math.max(dx, -dy); break;
        case 'tl': delta = Math.max(-dx, -dy); break;
      }

      resizeCrop(delta);
    }
  };

  const handlePointerUp = () => {
    dragMode.current = 'none';
    activeCorner.current = null;
  };

  // Wheel zoom — also enforce a lower bound so the image never shrinks
  // below the current crop size when constrainToImage is on.
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        let next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.001));
        if (constrainToImage && imgNatural.w > 0 && imgNatural.h > 0) {
          const minScaleForCrop = Math.max(
            cropW / imgNatural.w,
            cropH / imgNatural.h,
          );
          if (next < minScaleForCrop) next = minScaleForCrop;
        }
        setOffset((o) => clampOffset(o.x, o.y, next, cropW, cropH));
        return next;
      });
    },
    [clampOffset, cropW, cropH, constrainToImage, imgNatural],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Confirm — render to canvas
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;

    if (isCircle) {
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
    const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
    const srcW = cropW / scale;
    const srcH = cropH / scale;

    ctx.drawImage(
      img,
      srcCenterX - srcW / 2,
      srcCenterY - srcH / 2,
      srcW,
      srcH,
      0,
      0,
      outW,
      outH,
    );

    canvas.toBlob(
      (blob) => { if (blob) onConfirm(blob); },
      'image/jpeg',
      quality,
    );
  };

  if (!imgNatural.w) return null;

  const maskId = `crop-mask-${isCircle ? 'circle' : 'rect'}`;
  const halfW = cropW / 2;
  const halfH = cropH / 2;

  const cursorForCorner: Record<Corner, string> = {
    tl: 'nwse-resize', br: 'nwse-resize',
    tr: 'nesw-resize', bl: 'nesw-resize',
  };

  return (
    <Modal open onClose={onCancel} className="flex flex-col items-center gap-4 p-6 w-[480px] max-w-[95vw]">
      <h3 className="text-base font-medium text-text-main">{title}</h3>

      <div
        ref={containerRef}
        className="relative select-none touch-none overflow-hidden bg-black/20"
        style={{ width: containerSize, height: containerH, cursor: 'grab' }}
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

        {/* Overlay mask */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerSize}
          height={containerH}
          viewBox={`0 0 ${containerSize} ${containerH}`}
        >
          <defs>
            <mask id={maskId}>
              <rect width={containerSize} height={containerH} fill="white" />
              {isCircle ? (
                <circle cx={containerSize / 2} cy={containerH / 2} r={halfW - 1} fill="black" />
              ) : (
                <rect x={(containerSize - cropW) / 2} y={(containerH - cropH) / 2} width={cropW} height={cropH} fill="black" />
              )}
            </mask>
          </defs>
          <rect width={containerSize} height={containerH} fill="rgba(0,0,0,0.55)" mask={`url(#${maskId})`} />

          {/* Crop border */}
          {isCircle ? (
            <circle
              cx={containerSize / 2} cy={containerH / 2} r={halfW - 1}
              fill="none" stroke="white" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
            />
          ) : (
            <rect
              x={(containerSize - cropW) / 2} y={(containerH - cropH) / 2} width={cropW} height={cropH}
              fill="none" stroke="white" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
            />
          )}
        </svg>

        {/* Corner resize handles */}
        {[
          { key: 'tl' as Corner, cx: -halfW, cy: -halfH },
          { key: 'tr' as Corner, cx: halfW, cy: -halfH },
          { key: 'bl' as Corner, cx: -halfW, cy: halfH },
          { key: 'br' as Corner, cx: halfW, cy: halfH },
        ].map((c) => (
          <div
            key={c.key}
            style={{
              position: 'absolute',
              left: containerSize / 2 + c.cx - HANDLE_SIZE / 2,
              top: containerH / 2 + c.cy - HANDLE_SIZE / 2,
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
        ))}
      </div>

      <p className="text-xs text-text-sub text-center">
        Перетащите для перемещения, прокрутите для масштабирования, потяните за углы для изменения размера
      </p>

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
