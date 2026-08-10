// EXPO_PUBLIC_ prefiks — Metro/EAS ga inline-a u JS bundle u vrijeme builda (ne runtime).
// Lokalno (.env, gitignored) postavlja LAN IP backend adrese za Expo Go/dev client rad —
// telefon i računalo moraju biti na istoj WiFi mreži, mijenja se ako se mreža promijeni.
// eas.json postavlja produkcijsku vrijednost za preview/production profile, pa svaki
// standalone build automatski cilja https://sliptrack.duckdns.org/api bez ručne izmjene ovdje.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.2:8080/api";