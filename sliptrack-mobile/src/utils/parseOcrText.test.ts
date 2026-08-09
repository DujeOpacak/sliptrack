import { parseOcrText } from "./parseOcrText";

describe("parseOcrText", () => {
  test("izvlači sva polja iz potpunog OCR teksta", () => {
    const result = parseOcrText([
      "HR1210010051863000160",
      "HR01 1234567890",
      "Iznos: 1.234,56 EUR",
    ]);

    expect(result).toEqual({
      iban: "HR1210010051863000160",
      amount: 1234.56,
      paymentModel: "HR01",
      referenceNumber: "1234567890",
    });
  });

  test("normalizira IBAN s razmacima koje OCR ubaci između znamenki", () => {
    const result = parseOcrText(["HR12 10010051863000160"]);
    expect(result?.iban).toBe("HR1210010051863000160");
  });

  // Regresijski test za popravljen bug: AMOUNT_REGEX je prije gubio vodeću
  // znamenku kad OCR ne prepozna točku tisućice (vratio 234.56 umjesto 1234.56).
  test("iznos bez točke tisućice parsira se u cijelosti", () => {
    const result = parseOcrText(["Iznos za platiti: 1234,56 kn"]);
    expect(result?.amount).toBe(1234.56);
  });

  test("iznos s točkom tisućice i dalje radi ispravno", () => {
    const result = parseOcrText(["Ukupno: 12.345,67"]);
    expect(result?.amount).toBe(12345.67);
  });

  test("mali iznos bez decimalnih tisućica", () => {
    const result = parseOcrText(["56,78"]);
    expect(result?.amount).toBe(56.78);
  });

  test("ne matcha iznos s tri decimale kao valjan HR format", () => {
    const result = parseOcrText(["123,456"]);
    expect(result?.amount).toBeUndefined();
  });

  test("vraća null kad nema ni IBAN-a ni iznosa", () => {
    const result = parseOcrText(["Nema nikakvih relevantnih podataka na slici"]);
    expect(result).toBeNull();
  });

  test("radi i kad je prisutan samo iznos, bez IBAN-a", () => {
    const result = parseOcrText(["Za platiti 99,99"]);
    expect(result).toEqual({
      iban: undefined,
      amount: 99.99,
      paymentModel: undefined,
      referenceNumber: undefined,
    });
  });

  test("radi i kad je prisutan samo IBAN, bez iznosa", () => {
    const result = parseOcrText(["HR1210010051863000160"]);
    expect(result?.iban).toBe("HR1210010051863000160");
    expect(result?.amount).toBeUndefined();
  });
});
