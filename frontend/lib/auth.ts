export type StoredUser = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  isActive?: boolean;
  avatarUrl?: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem('ams-user');
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ams-user', JSON.stringify(user));
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-token');
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ams-token', token);
}

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-refresh-token');
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ams-refresh-token', token);
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('ams-user');
  window.localStorage.removeItem('ams-token');
  window.localStorage.removeItem('ams-refresh-token');
}

export function getStoredAvatarUrl() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-avatar-url');
}

export function setStoredAvatarUrl(url: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ams-avatar-url', url);
}

export function withAvatarCacheBust(url?: string) {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

export function notifyAvatarUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ams-avatar-updated'));
}
