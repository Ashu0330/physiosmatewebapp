/**
 * Pure JWT parsing and structural validation helpers (SSR-safe, no HTTP dependencies).
 */

export const PROTECTED_ROUTE_PREFIXES = [
  '/user-dashboard',
  '/doctor-dashboard',
  '/clinic-dashboard',
  '/settings',
  '/practice-management',
  '/schedule-treatment',
  '/consultancy-list',
] as const;

export function normalizeTokenString(rawToken: string | null | undefined): string | null {
  if (!rawToken) return null;
  const trimmed = rawToken.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }
  return trimmed;
}

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return normalizeTokenString(localStorage.getItem('token'));
}

export function decodeJwtPayload(token: string | null | undefined): Record<string, any> | null {
  const clean = normalizeTokenString(token);
  if (!clean) return null;

  const parts = clean.split('.');
  if (parts.length !== 3 || parts.some(part => !part.trim())) {
    return null;
  }

  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 2) base64 += '==';
    else if (pad === 3) base64 += '=';
    else if (pad === 1) return null;

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    const payload = JSON.parse(jsonStr);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

export function getJwtUserId(payload: Record<string, any> | null): string | null {
  if (!payload) return null;
  const raw =
    payload['sub'] ??
    payload['nameid'] ??
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value ? value : null;
}

export function isJwtTokenValid(token: string | null | undefined): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const userId = getJwtUserId(payload);
  if (!userId) return false;

  const exp = Number(payload['exp']);
  if (!Number.isFinite(exp) || exp <= 0) return false;

  return Date.now() < exp * 1000;
}

export function isProtectedAppUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return PROTECTED_ROUTE_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
}
