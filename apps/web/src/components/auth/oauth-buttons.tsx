'use client';

import type { ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Provider Icons (inline SVGs) ──────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.27l3.66-3.18z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.72 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.73l3.66 2.84c.87-2.6 3.3-4.19 6.16-4.19z" fill="#EA4335"/>
    </svg>
  );
}

function VKIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.77 19.15h1.27s.38-.04.58-.25c.18-.19.17-.55.17-.55s-.03-1.67.75-1.92c.77-.24 1.76 1.6 2.81 2.31.8.53 1.4.42 1.4.42l2.81-.04s1.47-.09.77-1.24c-.06-.09-.4-.85-2.09-2.4-1.77-1.62-1.53-1.36.6-4.17 1.3-1.7 1.82-2.75 1.66-3.2-.15-.42-1.1-.31-1.1-.31l-3.17.02s-.24-.03-.41.07c-.17.1-.28.34-.28.34s-.5 1.33-1.16 2.47c-1.4 2.4-1.96 2.53-2.19 2.38-.53-.35-.4-1.4-.4-2.14 0-2.33.35-3.3-.69-3.55-.35-.08-.6-.14-1.48-.15-1.13-.01-2.09 0-2.63.27-.36.18-.63.58-.46.6.21.03.69.13.94.48.33.45.31 1.47.31 1.47s.19 2.74-.44 3.08c-.43.24-1.02-.24-2.29-2.42-.65-1.12-1.14-2.35-1.14-2.35s-.1-.23-.26-.36c-.2-.15-.49-.2-.49-.2l-3.01.02s-.45.01-.62.21c-.14.18-.01.55-.01.55s2.33 5.45 4.97 8.2c2.42 2.52 5.16 2.35 5.16 2.35z"/>
    </svg>
  );
}

function YandexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.63 21.35h2.33V2.65h-3.72c-3.67 0-5.6 1.87-5.6 4.64 0 2.33 1.14 3.64 3.3 5.13l-3.6 8.93h2.5l3.92-9.73-.91-.64c-1.76-1.24-2.6-2.17-2.6-4.02 0-1.73 1.17-2.96 3.15-2.96h1.23v17.35z"/>
    </svg>
  );
}

// ─── Provider Config ───────────────────────────────────────────────────────

interface OAuthProvider {
  key: string;
  label: string;
  color: string;
  hoverColor: string;
  icon: (props: { className?: string }) => ReactNode;
}

const PROVIDERS: OAuthProvider[] = [
  { key: 'google', label: 'Google', color: '#fff', hoverColor: '#f5f5f5', icon: GoogleIcon },
  { key: 'vk', label: 'VK', color: '#0077FF', hoverColor: '#006ae6', icon: VKIcon },
  { key: 'yandex', label: 'Яндекс', color: '#FC3F1D', hoverColor: '#e33516', icon: YandexIcon },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface OAuthButtonsProps {
  /** If true, shows linking mode (for profile page) */
  linkMode?: boolean;
  /** Connected provider keys (for link mode — shows "Отключить" instead) */
  connectedProviders?: string[];
  /** Called when user clicks "Отключить" */
  onUnlink?: (provider: string) => void;
  className?: string;
}

export function OAuthButtons({ linkMode, connectedProviders = [], onUnlink, className }: OAuthButtonsProps) {
  const handleClick = (provider: string) => {
    const url = linkMode
      ? `${API_URL}/auth/oauth/${provider}?link=true`
      : `${API_URL}/auth/oauth/${provider}`;
    window.location.assign(url);
  };

  // Login/Register mode — icon-only row
  if (!linkMode) {
    return (
      <div className={`flex items-center justify-center gap-3 ${className ?? ''}`}>
        {PROVIDERS.map((p) => {
          const isGoogle = p.key === 'google';
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handleClick(p.key)}
              title={p.label}
              className="flex items-center justify-center w-12 h-12 border border-border-light transition-colors cursor-pointer"
              style={{ backgroundColor: p.color }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.hoverColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.color; }}
            >
              <p.icon className={`w-6 h-6 ${isGoogle ? '' : 'text-text-on-dark'}`} />
            </button>
          );
        })}
      </div>
    );
  }

  // Profile link mode — icon + label + status
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      {PROVIDERS.map((p) => {
        const isConnected = connectedProviders.includes(p.key.toUpperCase());
        const isGoogle = p.key === 'google';

        if (isConnected) {
          return (
            <div key={p.key} className="flex items-center gap-3 py-2">
              <div
                className="flex items-center justify-center w-9 h-9 flex-shrink-0 border border-border-light"
                style={{ backgroundColor: p.color }}
              >
                <p.icon className={`w-5 h-5 ${isGoogle ? '' : 'text-text-on-dark'}`} />
              </div>
              <span className="text-sm text-text-main flex-1">{p.label}</span>
              <span className="text-xs text-success">Подключён</span>
              {onUnlink && (
                <button
                  type="button"
                  onClick={() => onUnlink(p.key)}
                  className="text-xs text-brand-red hover:underline cursor-pointer"
                >
                  Отключить
                </button>
              )}
            </div>
          );
        }

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => handleClick(p.key)}
            className="flex items-center gap-3 py-2 cursor-pointer group"
          >
            <div
              className="flex items-center justify-center w-9 h-9 flex-shrink-0 border border-border-light transition-colors"
              style={{ backgroundColor: p.color }}
            >
              <p.icon className={`w-5 h-5 ${isGoogle ? '' : 'text-text-on-dark'}`} />
            </div>
            <span className="text-sm text-text-sub group-hover:text-text-main transition-colors">
              Подключить {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
