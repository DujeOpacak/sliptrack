import { parseHub3Barcode } from "./parseHub3";

function buildHub3(overrides: Partial<Record<number, string>> = {}, lineCount = 14): string {
  const defaults: Record<number, string> = {
    0: "HRVHUB30",
    1: "EUR",
    2: "000000000012550",
    3: "Ime Prezime platitelja",
    4: "Adresa platitelja",
    5: "Grad platitelja",
    6: "HEP ELEKTRA",
    7: "Ulica primatelja",
    8: "Grad primatelja",
    9: "HR1210010051863000160",
    10: "HR01",
    11: "1234567890",
    12: "XXXX",
    13: "Struja - srpanj 2026",
  };
  const merged = { ...defaults, ...overrides };
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    lines.push(merged[i] ?? "");
  }
  return lines.join("\n");
}

describe("parseHub3Barcode", () => {
  test("parsira potpun HUB-3 string", () => {
    const result = parseHub3Barcode(buildHub3());

    expect(result).toEqual({
      iban: "HR1210010051863000160",
      amount: 125.5,
      providerName: "HEP ELEKTRA",
      paymentModel: "HR01",
      referenceNumber: "1234567890",
      description: "Struja - srpanj 2026",
    });
  });

  test("iznos u centima pretvara u decimalni broj", () => {
    const result = parseHub3Barcode(buildHub3({ 2: "000000000000001" }));
    expect(result?.amount).toBe(0.01);
  });

  test("vraća null za pogrešno zaglavlje", () => {
    const result = parseHub3Barcode(buildHub3({ 0: "NIJEHUB3" }));
    expect(result).toBeNull();
  });

  test("vraća null kad ima manje od 10 linija", () => {
    const result = parseHub3Barcode(buildHub3({}, 9));
    expect(result).toBeNull();
  });

  test("vraća null za neispravan iznos", () => {
    const result = parseHub3Barcode(buildHub3({ 2: "nije-broj" }));
    expect(result).toBeNull();
  });

  test("vraća null kad IBAN primatelja nedostaje", () => {
    const result = parseHub3Barcode(buildHub3({ 9: "" }));
    expect(result).toBeNull();
  });

  test("opcionalna polja postaju undefined kad nedostaju (kraći string, samo 10 linija)", () => {
    const result = parseHub3Barcode(buildHub3({}, 10));

    expect(result).toEqual({
      iban: "HR1210010051863000160",
      amount: 125.5,
      providerName: "HEP ELEKTRA",
      paymentModel: undefined,
      referenceNumber: undefined,
      description: undefined,
    });
  });
});
