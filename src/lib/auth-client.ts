const TOKEN_KEY = "qri_token";

/**
 * Where we're keeping the JWT for now. localStorage is a simple,
 * well-known pattern - not as XSS-hardened as an httpOnly cookie set by
 * the server would be, but appropriately simple for this stage. Worth
 * revisiting closer to production.
 */
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}