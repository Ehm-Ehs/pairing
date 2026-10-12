/** The date `days` working days (Monday to Friday) after `from`. Public holidays are not counted. */
export function addWorkingDays(from: number | Date, days: number): Date {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}
