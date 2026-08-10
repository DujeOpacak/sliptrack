// Dev: admin (Vite, :5173) i backend (:8080) su različiti origin, treba puna adresa.
// Prod: nginx servira admin i backend s iste domene (/api/... isti origin) — relativan
// "/api" put automatski pogodi ispravan host, bez hardkodirane domene u buildu.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
