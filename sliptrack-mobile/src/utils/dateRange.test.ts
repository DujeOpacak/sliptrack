import { getDueDateRange } from "./dateRange";

describe("getDueDateRange", () => {
  test("bez godine vraća prazan raspon (svi filteri isključeni)", () => {
    expect(getDueDateRange(undefined, undefined)).toEqual({});
  });

  test("samo godina (bez mjeseca) vraća cijelu kalendarsku godinu", () => {
    expect(getDueDateRange(2026, undefined)).toEqual({
      dueDateFrom: "2026-01-01",
      dueDateTo: "2026-12-31",
    });
  });

  test("godina i mjesec vraćaju raspon tog mjeseca", () => {
    expect(getDueDateRange(2026, 7)).toEqual({
      dueDateFrom: "2026-07-01",
      dueDateTo: "2026-07-31",
    });
  });

  test("mjesec ispravno računa zadnji dan za 30-dnevni mjesec", () => {
    expect(getDueDateRange(2026, 4)).toEqual({
      dueDateFrom: "2026-04-01",
      dueDateTo: "2026-04-30",
    });
  });

  test("veljača u prijestupnoj godini ima 29 dana", () => {
    expect(getDueDateRange(2028, 2)).toEqual({
      dueDateFrom: "2028-02-01",
      dueDateTo: "2028-02-29",
    });
  });

  test("veljača u neprijestupnoj godini ima 28 dana", () => {
    expect(getDueDateRange(2026, 2)).toEqual({
      dueDateFrom: "2026-02-01",
      dueDateTo: "2026-02-28",
    });
  });

  test("mjesec pod 10 se popuni nulom (npr. 03, ne 3)", () => {
    expect(getDueDateRange(2026, 3)).toEqual({
      dueDateFrom: "2026-03-01",
      dueDateTo: "2026-03-31",
    });
  });
});
