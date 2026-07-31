function pad(n: number) {
  return String(n).padStart(2, "0");
}

// month je 1-12
export function getDueDateRange(
  year: number | undefined,
  month: number | undefined,
): { dueDateFrom?: string; dueDateTo?: string } {
  if (!year) {
    return {};
  }
  if (!month) {
    return { dueDateFrom: `${year}-01-01`, dueDateTo: `${year}-12-31` };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dueDateFrom: `${year}-${pad(month)}-01`,
    dueDateTo: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}
