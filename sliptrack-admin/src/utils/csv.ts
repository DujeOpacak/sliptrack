function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string) {
  // BOM so Excel opens UTF-8 (č/ć/š/ž etc.) without mangling it.
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
