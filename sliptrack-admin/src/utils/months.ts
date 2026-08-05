const MONTHS_SHORT = ["sij", "velj", "ožu", "tra", "svi", "lip", "srp", "kol", "ruj", "lis", "stu", "pro"];

export function formatMonthLabel(year: number, monthIndex0: number): string {
  return `${MONTHS_SHORT[monthIndex0]} ${String(year).slice(2)}`;
}

// Continuous list of the last `count` months (oldest first, current month last),
// each keyed "YYYY-MM" — used to zero-fill months with no data instead of
// silently skipping them (same approach as the mobile dashboard timeline).
export function lastNMonths(count: number, reference = new Date()): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex0 = d.getMonth();
    const key = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
    months.push({ key, label: formatMonthLabel(year, monthIndex0) });
  }
  return months;
}
