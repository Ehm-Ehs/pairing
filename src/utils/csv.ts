export type CsvCell = string | number | null | undefined;

/**
 * Quotes one CSV cell. Doubles embedded quotes, and neutralises values that a
 * spreadsheet would run as a formula (participant-supplied names reach organizers' Excel).
 */
export function csvCell(value: CsvCell): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** Turns an event title into a safe file name stem. */
export function fileStem(title: string | undefined, fallback = "event"): string {
  return (title || fallback).trim().replace(/[^\w-]+/g, "_") || fallback;
}

/** Builds a CSV file and starts the download in the browser. */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  const blob = new Blob(["﻿" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
