'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface ImageGalleryZoomConfig {
  /** Magnification factor. @default 2.5 */
  scale?: number;
}

export interface ImageGalleryProps {
  /** Image URLs */
  images: string[];
  /** Alt text (index is appended automatically). @default '' */
  alt?: string;
  /**
   * - `product` – vertical thumbnails left + large main image right (desktop), snap carousel (mobile)
   * - `compact` – horizontal thumbnails below + smaller main image, 16:9 aspect
   * @default 'product'
   */
  variant?: 'product' | 'compact';
  /**
   * Switch active image on thumbnail hover or click only.
   * @default 'hover'
   */
  switchOn?: 'hover' | 'click';
  /**
   * Zoom on main-image hover.
   * `true` = defaults (scale 2.5), or pass a config object.
   * @default false
   */
  zoom?: boolean | ImageGalleryZoomConfig;
  /**
   * Open a fullscreen lightbox on main-image click.
   * @default true
   */
  fullscreen?: boolean;
  /**
   * Show ← → arrow buttons on the mobile carousel.
   * @default false
   */
  mobileArrows?: boolean;
  className?: string;
}

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function resolveZoom(z?: boolean | ImageGalleryZoomConfig): { scale: number } | null {
  if (!z) return null;
  return { scale: z === true ? 2.5 : (z.scale ?? 2.5) };
}

/* ═══════════════════════════════════════════════════════
   Icons (lucide-react)
   ═══════════════════════════════════════════════════════ */

function ChevronIcon({ direction, className }: { direction: 'up' | 'down' | 'left' | 'right'; className?: string }) {
  const iconClass = cn('w-5 h-5', className);
  const icons = { up: ChevronUp, down: ChevronDown, left: ChevronLeft, right: ChevronRight };
  const Icon = icons[direction];
  return <Icon className={iconClass} />;
}

function ArrowIcon({ direction, className }: { direction: 'left' | 'right'; className?: string }) {
  const Icon = direction === 'left' ? ArrowLeft : ArrowRight;
  return <Icon className={cn('w-6 h-6', className)} />;
}

function CloseIcon({ className }: { className?: string }) {
  return <X className={cn('w-8 h-8', className)} />;
}

/* ═══════════════════════════════════════════════════════
   Image with spinner skeleton
   ═══════════════════════════════════════════════════════ */

function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('w-8 h-8 animate-spin text-[#A6A6A6]', className)} />;
}

function LoadableImg({
  src,
  alt,
  className,
  style,
  draggable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  /* reset state when src changes */
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setError(false);
  }

  return (
    <>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F0F0F0]">
          <Spinner />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, 'transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        style={style}
        draggable={draggable}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Zoomable Main Image
   ═══════════════════════════════════════════════════════ */

function MainImage({
  src,
  alt,
  zoomCfg,
  clickable,
  onClick,
  className,
}: {
  src: string;
  alt: string;
  zoomCfg: { scale: number } | null;
  clickable: boolean;
  onClick: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!zoomCfg || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setOrigin(`${x}% ${y}%`);
    },
    [zoomCfg],
  );

  const cursor = zoomCfg ? 'cursor-crosshair' : clickable ? 'cursor-zoom-in' : '';

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden relative', cursor, className)}
      onMouseEnter={() => zoomCfg && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMove}
      onClick={clickable ? onClick : undefined}
    >
      <LoadableImg
        src={src}
        alt={alt}
        className="w-full h-full object-contain select-none"
        style={
          hovering && zoomCfg
            ? { transformOrigin: origin, transform: `scale(${zoomCfg.scale})`, transitionProperty: 'transform', transitionDuration: '150ms' }
            : { transitionProperty: 'transform, opacity', transitionDuration: '150ms, 300ms' }
        }
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Fullscreen Lightbox Modal
   ═══════════════════════════════════════════════════════ */

function LightboxModal({
  images,
  alt,
  startIndex,
  onClose,
}: {
  images: string[];
  alt: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const touchX = useRef<number | null>(null);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col select-none" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-white/60 text-sm tabular-nums">{idx + 1} / {images.length}</span>
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white cursor-pointer" aria-label="Закрыть">
          <CloseIcon />
        </button>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center relative px-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const d = touchX.current - e.changedTouches[0].clientX;
          if (Math.abs(d) > 50) { if (d > 0) next(); else prev(); }
          touchX.current = null;
        }}
      >
        {images.length > 1 && (
          <button type="button" onClick={prev} className="absolute left-2 z-10 p-2 text-white/60 hover:text-white cursor-pointer" aria-label="Назад">
            <ChevronIcon direction="left" className="w-8 h-8" />
          </button>
        )}
        <img
          src={images[idx]}
          alt={`${alt} ${idx + 1}`}
          className="max-w-full max-h-[75vh] object-contain"
          draggable={false}
        />
        {images.length > 1 && (
          <button type="button" onClick={next} className="absolute right-2 z-10 p-2 text-white/60 hover:text-white cursor-pointer" aria-label="Вперёд">
            <ChevronIcon direction="right" className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 px-4 py-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }} onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                'w-14 h-14 flex-shrink-0 rounded overflow-hidden border-2 transition-colors cursor-pointer',
                i === idx ? 'border-white' : 'border-white/20 hover:border-white/50',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Mobile Carousel
   ═══════════════════════════════════════════════════════ */

function MobileCarousel({
  images,
  alt,
  aspectClass,
  showArrows,
  onTap,
}: {
  images: string[];
  alt: string;
  aspectClass: string;
  showArrows: boolean;
  onTap: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.offsetWidth));
  }, []);

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    setActive(index);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 w-full">
        {showArrows && images.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(Math.max(0, active - 1))}
            className="flex-shrink-0 text-text-main"
            aria-label="Предыдущее фото"
          >
            <ArrowIcon direction="left" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory flex-1 min-w-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((src, i) => (
            <div key={i} className={cn('flex-shrink-0 w-full snap-start relative', aspectClass)} onClick={() => onTap(i)}>
              <LoadableImg src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-contain cursor-pointer" />
            </div>
          ))}
        </div>
        {showArrows && images.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(Math.min(images.length - 1, active + 1))}
            className="flex-shrink-0 text-text-main"
            aria-label="Следующее фото"
          >
            <ArrowIcon direction="right" />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-[6px]">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn('w-[13px] h-[13px] rounded-full transition-colors', i === active ? 'bg-brand-red' : 'bg-[#A6A6A6]')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ImageGallery — exported component
   ═══════════════════════════════════════════════════════ */

export function ImageGallery({
  images,
  alt = '',
  variant = 'product',
  switchOn = 'hover',
  zoom = false,
  fullscreen = true,
  mobileArrows = false,
  className,
}: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  const zoomCfg = resolveZoom(zoom);
  if (images.length === 0) return null;

  const active = Math.min(activeIdx, images.length - 1);

  /* thumbnail interaction handler */
  const thumbProps = (i: number) =>
    switchOn === 'hover'
      ? { onMouseEnter: () => setActiveIdx(i), onClick: () => setActiveIdx(i) }
      : { onClick: () => setActiveIdx(i) };

  const openModal = (i: number) => {
    if (!fullscreen) return;
    setActiveIdx(i);
    setModalOpen(true);
  };

  /* scroll active thumbnail into view */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const child = el.children[active] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [active]);

  /* ── Product layout (desktop) ── */
  const productDesktop = (
    <div className="hidden lg:flex gap-[23px]">
      {images.length > 1 && (
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={active === 0}
            className="p-1 text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-default"
            aria-label="Вверх"
          >
            <ChevronIcon direction="up" />
          </button>
          <div
            ref={thumbRef}
            className="flex flex-col gap-4 overflow-y-auto max-h-[580px]"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                {...thumbProps(i)}
                className={cn(
                  'relative w-[107px] h-[144px] flex-shrink-0 overflow-hidden border-2 transition-colors cursor-pointer',
                  i === active ? 'border-text-main/49' : 'opacity-70 hover:opacity-100 border-transparent',
                )}
              >
                <img src={src} alt="" className="w-full h-full object-cover p-1" draggable={false} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveIdx((i) => Math.min(images.length - 1, i + 1))}
            disabled={active === images.length - 1}
            className="p-1 text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-default"
            aria-label="Вниз"
          >
            <ChevronIcon direction="down" />
          </button>
        </div>
      )}
      <MainImage
        src={images[active]}
        alt={alt}
        zoomCfg={zoomCfg}
        clickable={fullscreen}
        onClick={() => openModal(active)}
        className="w-[468px] h-[656px] flex-shrink-0 bg-white rounded-sm"
      />
    </div>
  );

  /* ── Compact layout (desktop) ── */
  const compactDesktop = (
    <div className="hidden lg:flex flex-col gap-2">
      <MainImage
        src={images[active]}
        alt={alt}
        zoomCfg={zoomCfg}
        clickable={fullscreen}
        onClick={() => openModal(active)}
        className="w-full aspect-video bg-[#E8E8E8] rounded-sm"
      />
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              {...thumbProps(i)}
              className={cn(
                'relative w-20 h-16 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer',
                i === active ? 'border-brand-red' : 'border-transparent hover:border-text-sub/30',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const mobileAspect = variant === 'product' ? 'aspect-[293/410]' : 'aspect-video';

  return (
    <div className={className}>
      {/* Mobile — snap carousel */}
      <div className="lg:hidden">
        <MobileCarousel images={images} alt={alt} aspectClass={mobileAspect} showArrows={mobileArrows} onTap={(i) => openModal(i)} />
      </div>

      {/* Desktop */}
      {variant === 'product' ? productDesktop : compactDesktop}

      {/* Lightbox */}
      {modalOpen && (
        <LightboxModal images={images} alt={alt} startIndex={active} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

ImageGallery.displayName = 'ImageGallery';
