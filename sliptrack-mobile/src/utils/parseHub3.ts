export interface ParsedHub3Data {
  iban: string;
  amount: number;
  referenceNumber?: string;
  paymentModel?: string;
  providerName?: string;
  description?: string;
}

// HUB-3 barkod sadrzi ispravan UTF-8 tekst, ali Android-ov native barkod dekoder
// (ZXing/MLKit unutar expo-camera) hrvatsku dijakritiku (c/c/s/z/d) dekodira kao da je
// Latin-1 (1 bajt = 1 znak), umjesto ispravnog citanja visebajtnih UTF-8 sekvenci -
// otkriveno fizickim testiranjem (npr. "SVEUCILISTE" stize kao "SVEUAeILIA TE" -
// dvoznak Ae/A odgovara prvom bajtu UTF-8 sekvence, drugi bajt nestane iz prikaza).
// Reverzibilno preko klasicnog escape/decodeURIComponent trika: escape() vrati svaki
// znak u njegov postotno-kodiran bajt (Latin-1 code point == bajt vrijednost),
// decodeURIComponent() te bajtove ispravno dekodira kao UTF-8 sekvencu. escape/unescape
// su "legacy" u specifikaciji ali nikad nece biti uklonjene - sigurnije od TextDecoder-a koji nije zagaranitran u React Native/Hermes runtimeu.
function decodeMisreadUtf8(text: string): string {
  // Ako string sadrzi ijedan znak izvan Latin-1 raspona (0x00-0xFF), vec je ispravan
  // Unicode (npr. platforma koja dekodira UTF-8 ispravno)
  if (/[^\u0000-\u00ff]/.test(text)) {
    return text;
  }
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text; // nije bio ispravan UTF-8 zapisan kao Latin-1 - vrati original
  }
}

// HUB-3 field order (fiksni redoslijed odvojen \n):
// 0 HRVHUB30 - 1 valuta - 2 iznos (centi, bez decimalne tocke) - 3-5 platitelj (ime/adresa/grad)
// 6-8 primatelj (naziv/ulica/grad) - 9 IBAN primatelja - 10 model placanja - 11 poziv na broj
// 12 sifra namjene - 13 opis
export function parseHub3Barcode(rawInput: string): ParsedHub3Data | null {
  const raw = decodeMisreadUtf8(rawInput);
  const lines = raw.split("\n");
  if (lines.length < 10 || lines[0]?.trim() !== "HRVHUB30") {
    return null;
  }

  const amountRaw = lines[2]?.trim() ?? "";
  const amountCents = parseInt(amountRaw, 10);
  if (isNaN(amountCents)) {
    return null;
  }

  const iban = lines[9]?.trim() ?? "";
  if (!iban) {
    return null;
  }

  return {
    iban,
    amount: amountCents / 100,
    providerName: lines[6]?.trim() || undefined,
    paymentModel: lines[10]?.trim() || undefined,
    referenceNumber: lines[11]?.trim() || undefined,
    description: lines[13]?.trim() || undefined,
  };
}
