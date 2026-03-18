const STORAGE_KEY = 'dev_accounts';

export interface DevAccount {
  label: string;
  email?: string;
  roles: string[];
  refreshToken: string;
}

export function getDevAccounts(): DevAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveDevAccount(account: DevAccount): void {
  const accounts = getDevAccounts();
  const idx = accounts.findIndex((a) => a.refreshToken === account.refreshToken);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function removeDevAccount(refreshToken: string): void {
  const accounts = getDevAccounts().filter((a) => a.refreshToken !== refreshToken);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}
