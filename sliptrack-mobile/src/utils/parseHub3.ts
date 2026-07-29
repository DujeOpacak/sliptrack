export interface ParsedHub3Data {
  iban: string;
  amount: number;
  referenceNumber?: string;
  paymentModel?: string;
  providerName?: string;
  description?: string;
}

// HUB-3 field order (fiksni redoslijed odvojen \n), vidi CLAUDE.md "Plan implementacije skeniranja":
// 0 HRVHUB30 · 1 valuta · 2 iznos (centi, bez decimalne točke) · 3-5 platitelj (ime/adresa/grad)
// 6-8 primatelj (naziv/ulica/grad) · 9 IBAN primatelja · 10 model plaćanja · 11 poziv na broj
// 12 šifra namjene · 13 opis
export function parseHub3Barcode(raw: string): ParsedHub3Data | null {
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
