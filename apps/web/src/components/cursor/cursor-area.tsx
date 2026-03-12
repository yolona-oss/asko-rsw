'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCursors } from './cursor-context';
import { Cursor } from './cursor';

interface CursorAreaProps {
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CursorArea: React.FC<CursorAreaProps> = ({
  width = '100%',
  height = 'auto',
  children,
  className = '',
  style = {},
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const { cursors, updateCursor, emitClick, setContainerRef } = useCursors();
  const [isWithinArea, setIsWithinArea] = useState(false);
  const [areaRect, setAreaRect] = useState<DOMRect | null>(null);
  const [clickEffects, setClickEffects] = useState<Array<{ id: string; x: number; y: number; color: string }>>([]);
  const rafRef = useRef<number>(null);
  const resizeObserverRef = useRef<ResizeObserver>(null);

  // Update area rect on resize or scroll
  const updateAreaRect = useCallback(() => {
    if (areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
      setAreaRect(rect);
    }
  }, []);

  useEffect(() => {
    // Initial rect calculation
    updateAreaRect();

    // Set up resize observer
    resizeObserverRef.current = new ResizeObserver(updateAreaRect);
    if (areaRef.current) {
      resizeObserverRef.current.observe(areaRef.current);
    }

    // Listen to scroll events
    window.addEventListener('scroll', updateAreaRect, { passive: true });
    window.addEventListener('resize', updateAreaRect, { passive: true });

    // Share the area ref with the cursor context so CursorsRenderer can position cursors
    let cleanupContainerRef: (() => void) | undefined;
    if (areaRef.current) {
      cleanupContainerRef = setContainerRef(areaRef.current) as (() => void) | undefined;
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('scroll', updateAreaRect);
      window.removeEventListener('resize', updateAreaRect);
      cleanupContainerRef?.();
    };
  }, [updateAreaRect, setContainerRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!areaRef.current || !areaRect) return;

    // Cancel previous animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      // Calculate position relative to the area
      const x = e.clientX - areaRect.left;
      const y = e.clientY - areaRect.top;

      // Check if cursor is within the area boundaries
      const withinArea = x >= 0 && x <= areaRect.width && y >= 0 && y <= areaRect.height;

      setIsWithinArea(withinArea);

      if (withinArea) {
        // Determine cursor type based on element under cursor
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        let cursorType = 'default';

        if (elementUnderCursor) {
          const tagName = elementUnderCursor.tagName.toLowerCase();
          const computedStyle = window.getComputedStyle(elementUnderCursor);

          if (tagName === 'input' || tagName === 'textarea' || elementUnderCursor.getAttribute('contenteditable')) {
            cursorType = 'text';
          } else if (tagName === 'button' || tagName === 'a' || computedStyle.cursor === 'pointer') {
            cursorType = 'pointer';
          } else if (computedStyle.cursor === 'grab' || computedStyle.cursor === 'grabbing') {
            cursorType = 'grab';
          }
        }

        // Send relative coordinates (0-1 range) for consistent positioning across devices
        const relativeX = x / areaRect.width;
        const relativeY = y / areaRect.height;

        updateCursor(relativeX, relativeY, cursorType);
      } else {
        // Send cursor outside area
        updateCursor(-1, -1);
      }
    });
  }, [areaRect, updateCursor]);

  const handleMouseLeave = useCallback(() => {
    setIsWithinArea(false);
    updateCursor(-1, -1);
  }, [updateCursor]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!areaRef.current || !areaRect || !isWithinArea) return;

    const x = e.clientX - areaRect.left;
    const y = e.clientY - areaRect.top;

    // Send relative coordinates
    const relativeX = x / areaRect.width;
    const relativeY = y / areaRect.height;

    emitClick(relativeX, relativeY);

    // Add click effect at absolute screen position
    const clickEffect = {
      id: Date.now().toString() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      color: '#007bff',
    };

    setClickEffects(prev => [...prev, clickEffect]);

    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== clickEffect.id));
    }, 500);
  }, [areaRect, emitClick, isWithinArea]);

  useEffect(() => {
    const area = areaRef.current;
    if (area) {
      area.addEventListener('mousemove', handleMouseMove, { passive: true });
      area.addEventListener('mouseleave', handleMouseLeave);
      area.addEventListener('click', handleClick);

      return () => {
        area.removeEventListener('mousemove', handleMouseMove);
        area.removeEventListener('mouseleave', handleMouseLeave);
        area.removeEventListener('click', handleClick);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [handleMouseMove, handleMouseLeave, handleClick]);

  // Calculate aspect ratio if both dimensions are numbers
  const aspectRatioStyle = useMemo(() => {
    if (typeof width === 'number' && typeof height === 'number') {
      return {
        width: `${width}px`,
        height: `${height}px`,
      };
    }
    return {
      width,
      height,
    };
  }, [width, height]);

  return (
    <div
      ref={areaRef}
      className={`cursor-area ${className}`}
      style={{
        position: 'relative',
        ...aspectRatioStyle,
        backgroundColor: '#1a1a1a',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)',
        backgroundSize: '40px 40px',
        border: '2px solid #444',
        borderRadius: '12px',
        overflow: 'hidden',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      {/* Content container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children || (
          <div style={{
            textAlign: 'center',
            color: '#fff',
            background: 'rgba(0,0,0,0.5)',
            padding: '20px',
            borderRadius: '8px',
          }}>
            <h2>✨ Collaborative Cursor Area</h2>
            <p>Move your mouse here to see other users' cursors</p>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              Active cursors: {cursors.size}
            </p>
          </div>
        )}
      </div>

      {/* Click effects at screen position */}
      {clickEffects.map(effect => (
        <div
          key={effect.id}
          style={{
            position: 'fixed',
            left: effect.x,
            top: effect.y,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: effect.color,
            opacity: 0.5,
            animation: 'ripple 0.5s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
