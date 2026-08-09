export interface ParsedOcrData {
  iban?: string;
  amount?: number;
  referenceNumber?: string;
  paymentModel?: string;
}

// Za razliku od parseHub3Barcode (fiksni redoslijed polja), OCR tekst nema strukturu —
// ML Kit/Vision vraćaju niz prepoznatih linija bez garantiranog redoslijeda, zato se
// polja izvlače regexom nad spojenim tekstom, ne po poziciji. providerName/description
// namjerno se ne izvlače (nepouzdano bez oznaka polja) — korisnik ih upisuje ručno.
const IBAN_REGEX = /HR[ \t]?\d{2}(?:[ \t]?\d){17}/i;
const MODEL_REGEX = /\bHR\d{2}\b(?!\d)/;
const REFERENCE_AFTER_MODEL_REGEX = /\bHR\d{2}\b(?!\d)[\s:-]*(\d{4,26})/;
// Two alternatives, not one optional group: a properly thousands-grouped amount
// ("1.234,56") must win when present, but a plain run of digits ("1234,56" — OCR
// missed the separator dot) must still match its FULL length, not just the last
// 1-3 digits before the comma. The boundary lookaround/lookbehind pair on each
// alternative stops a match from starting or continuing mid-digit-run.
const AMOUNT_REGEX = /(?<!\d)\d{1,3}(?:\.\d{3})+,\d{2}(?!\d)|(?<!\d)\d+,\d{2}(?!\d)/;

export function parseOcrText(lines: string[]): ParsedOcrData | null {
  const text = lines.join("\n");

  const ibanMatch = text.match(IBAN_REGEX);
  const iban = ibanMatch ? ibanMatch[0].replace(/[ \t]/g, "").toUpperCase() : undefined;

  // IBAN uklonjen iz teksta prije traženja modela plaćanja — oba počinju s "HR" + 2 znamenke,
  // razlika je što IBAN nastavlja s još znamenki odmah iza (negativan lookahead ih ne razdvaja).
  const remainingText = ibanMatch ? text.replace(ibanMatch[0], "") : text;

  const modelMatch = remainingText.match(MODEL_REGEX);
  const paymentModel = modelMatch ? modelMatch[0].toUpperCase() : undefined;

  const referenceMatch = remainingText.match(REFERENCE_AFTER_MODEL_REGEX);
  const referenceNumber = referenceMatch?.[1];

  const amountMatch = text.match(AMOUNT_REGEX);
  const amount = amountMatch
    ? parseFloat(amountMatch[0].replace(/\./g, "").replace(",", "."))
    : undefined;

  if (!iban && amount === undefined) {
    return null;
  }

  return { iban, amount, referenceNumber, paymentModel };
}
