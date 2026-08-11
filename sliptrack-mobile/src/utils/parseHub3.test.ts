import { parseHub3Barcode } from "./parseHub3";

function corruptAsRealDeviceWould(correctText: string): string {
  return unescape(encodeURIComponent(correctText));
}

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

  describe("popravak Android mojibake buga (hrvatska dijakritika u UTF-8 pročitana kao Latin-1)", () => {
    test("regresijski test — stvaran slučaj otkriven fizičkim testiranjem (Sveučilište Algebra Bernays)", () => {
      const correctProviderName = "SVEUČILIŠTE ALGEBRA BERNAYS";
      const corrupted = buildHub3({ 6: corruptAsRealDeviceWould(correctProviderName) });

      const result = parseHub3Barcode(corrupted);

      expect(result?.providerName).toBe(correctProviderName);
    });

    test("ispravlja sve hrvatske dijakritike, malo i veliko slovo", () => {
      const correctDescription = "Plaćanje po predračunu — čćšžđ ČĆŠŽĐ";
      const corrupted = buildHub3({ 13: corruptAsRealDeviceWould(correctDescription) });

      const result = parseHub3Barcode(corrupted);

      expect(result?.description).toBe(correctDescription);
    });

    test("ne dira tekst koji je već ispravan Unicode (npr. iOS koji dekodira ispravno)", () => {
      const alreadyCorrect = buildHub3({ 6: "SVEUČILIŠTE ALGEBRA BERNAYS" });

      const result = parseHub3Barcode(alreadyCorrect);

      expect(result?.providerName).toBe("SVEUČILIŠTE ALGEBRA BERNAYS");
    });

    test("ne dira čisto ASCII tekst", () => {
      const result = parseHub3Barcode(buildHub3({ 6: "HEP ELEKTRA" }));
      expect(result?.providerName).toBe("HEP ELEKTRA");
    });
  });
});
