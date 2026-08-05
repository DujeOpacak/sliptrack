// Access token lives only in memory — never localStorage/sessionStorage (XSS surface on a web SPA).
// The refresh token never reaches JS at all; it's an HttpOnly cookie the browser manages automatically.
let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null) {
    accessToken = token;
  },
};
