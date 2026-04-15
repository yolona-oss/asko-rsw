export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'только что';

  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
  }

  if (hours < 24) {
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  }

  if (days === 1) {
    const d = new Date(timestamp);
    return `вчера в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  if (days < 7) {
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`;
  }

  const d = new Date(timestamp);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 19) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
