'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorProps {
  sessionId: string;
  x: number; // relative position (0-1)
  y: number; // relative position (0-1)
  color: string;
  username: string;
  cursorType?: string;
  isClicking?: boolean;
  containerRect?: DOMRect | null;
}

export const Cursor: React.FC<CursorProps> = ({
  sessionId,
  x,
  y,
  color,
  username,
  cursorType = 'default',
  isClicking = false,
  containerRect,
}) => {
  const [showClick, setShowClick] = useState(false);
  const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (isClicking) {
      setShowClick(true);
      const timer = setTimeout(() => setShowClick(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isClicking]);

  // Calculate screen position based on relative coordinates and container rect
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRect || x < 0 || y < 0) {
        setScreenPosition(null);
        return;
      }

      // Convert relative coordinates to absolute screen position
      const screenX = containerRect.left + (x * containerRect.width);
      const screenY = containerRect.top + (y * containerRect.height);

      setScreenPosition({ x: screenX, y: screenY });
    };

    // Use requestAnimationFrame for smooth updates
    const animate = () => {
      updatePosition();
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [x, y, containerRect]);

  // Don't render if position is invalid
  if (!screenPosition || x < 0 || y < 0) {
    return null;
  }

  const getCursorIcon = () => {
    switch (cursorType) {
      case 'text':
        return 'I';
      case 'pointer':
        return '👆';
      case 'grab':
        return '✋';
      default:
        return '👆';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
          mass: 0.5
        }}
        style={{
          position: 'relative',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        {/* Custom cursor SVG */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'block',
          }}
        >
          <path
            d="M2 2L10 22L13 14L22 11L2 2Z"
            fill={color}
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.5" />
        </svg>

        {/* Username badge - position relative to cursor */}
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            position: 'absolute',
            left: '24px',
            top: '-8px',
            backgroundColor: color,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '2px solid white',
            letterSpacing: '0.3px',
          }}
        >
          {username}
        </motion.div>

        {/* Cursor type indicator */}
        {cursorType !== 'default' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
            style={{
              position: 'absolute',
              right: '-4px',
              bottom: '-4px',
              backgroundColor: 'white',
              color: color,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: `2px solid ${color}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {getCursorIcon()}
          </motion.div>
        )}
      </motion.div>

      {/* Click ripple effect */}
      <AnimatePresence>
        {showClick && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: color,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
