'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CursorProvider, useCursors } from '@/components/cursor/cursor-context';
import { Cursor } from '@/components/cursor/cursor';
import { CursorArea } from '@/components/cursor/cursor-area';
import { v4 as uuidv4 } from 'uuid';

const CursorsRenderer: React.FC = () => {
  const { cursors, containerRect } = useCursors();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Render all other users' cursors */}
      {Array.from(cursors.values()).map((cursor) => (
        <Cursor
          key={cursor.sessionId}
          sessionId={cursor.sessionId}
          x={cursor.x}
          y={cursor.y}
          color={cursor.color}
          username={cursor.username}
          cursorType={cursor.cursorType}
          containerRect={containerRect}
        />
      ))}
    </div>
  );
};

export default function CollaborativeCursorsPage() {
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Get or create user ID
    let storedUserId = localStorage.getItem('cursor-user-id');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('cursor-user-id', storedUserId);
    }
    setUserId(storedUserId);

    // Get or create username
    let storedUsername = localStorage.getItem('cursor-username');
    if (!storedUsername) {
      const adjectives = ['Happy', 'Clever', 'Brave', 'Wise', 'Swift', 'Calm', 'Bright', 'Cool'];
      const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Phoenix', 'Dragon'];
      storedUsername = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
      localStorage.setItem('cursor-username', storedUsername);
    }
    setUsername(storedUsername);
  }, []);

  if (!userId || !username || windowSize.width === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  // Calculate responsive area size
  const areaWidth = Math.min(1600, windowSize.width - 40);
  const areaHeight = Math.min(900, windowSize.height - 200);

  return (
    <CursorProvider userId={userId} username={username}>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        overflow: 'auto',
      }}>
        <div style={{
          maxWidth: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              padding: '8px 16px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <span>👤 username: <strong>{username}</strong></span>
            </div>

            <div style={{
              padding: '8px 16px',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <span>Area: {areaWidth.toFixed(0)}x{areaHeight.toFixed(0)}</span>
            </div>
          </div>

          <CursorArea
            width={areaWidth}
            height={areaHeight}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              padding: '20px',
              width: '100%',
              height: '100%',
              overflow: 'auto',
            }}>
            </div>
          </CursorArea>

          <CursorsRenderer />

        </div>
      </div>
    </CursorProvider>
  );
}
