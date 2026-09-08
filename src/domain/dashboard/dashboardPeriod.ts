const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' });
export function businessDateParts(date: Date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) };
}
// Resolve local calendar boundaries, including historical daylight saving time.
export function businessMonthStart(year: number, monthIndex: number) {
  const target = Date.UTC(year, monthIndex, 1);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const p = businessDateParts(new Date(instant));
    instant += target - Date.UTC(p.year, p.month - 1, p.day, p.hour);
  }
  return new Date(instant);
}
export function dashboardPeriod(year: number, month?: number) {
  const boundary = businessMonthStart;
  return {
    start: boundary(year, month ? month - 1 : 0),
    end: boundary(month ? year : year + 1, month ?? 0),
    previousStart: boundary(month ? year : year - 1, month ? month - 2 : 0),
  };
}
