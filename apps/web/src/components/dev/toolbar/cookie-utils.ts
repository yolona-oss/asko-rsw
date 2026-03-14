'use client';

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'refreshTkn' && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function setRefreshTokenCookie(token: string, days: number = 7) {
  if (typeof document === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `refreshTkn=${encodeURIComponent(token)};${expires};path=/;SameSite=Lax`;
}

export function removeRefreshTokenCookie() {
  if (typeof document === 'undefined') return;

  document.cookie = 'refreshTkn=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
}
