export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem('ams-user');
  return value ? JSON.parse(value) : null;
}

export function setStoredUser(user: { id: string; email: string; role: string; fullName: string; isActive?: boolean }) {
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
