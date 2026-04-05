'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface OAuthProvider {
  key: string;
  label: string;
  color: string;
  textColor: string;
}

const PROVIDERS: OAuthProvider[] = [
  { key: 'google', label: 'Google', color: '#fff', textColor: '#323232' },
  { key: 'vk', label: 'VK', color: '#0077FF', textColor: '#fff' },
  { key: 'yandex', label: 'Яндекс', color: '#FC3F1D', textColor: '#fff' },
];

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
    window.location.href = url;
  };

  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      {PROVIDERS.map((p) => {
        const isConnected = connectedProviders.includes(p.key.toUpperCase());

        if (linkMode && isConnected) {
          return (
            <div key={p.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-text-main">{p.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-600">Подключён</span>
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
            </div>
          );
        }

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => handleClick(p.key)}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium border border-border-light transition-colors cursor-pointer hover:opacity-90"
            style={{ backgroundColor: p.color, color: p.textColor }}
          >
            {linkMode ? `Подключить ${p.label}` : p.label}
          </button>
        );
      })}
    </div>
  );
}
