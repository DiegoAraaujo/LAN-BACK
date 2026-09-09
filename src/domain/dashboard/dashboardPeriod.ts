const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' });
export function businessDateParts(date: Date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) };
}
// Resolve local calendar boundaries, including historical daylight saving time.
export function businessMonthStart(year: number, monthIndex: number, day = 1) {
  const target = Date.UTC(year, monthIndex, day);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const p = businessDateParts(new Date(instant));
    instant += target - Date.UTC(p.year, p.month - 1, p.day, p.hour);
  }
  return new Date(instant);
}
export function dashboardPeriod(year: number, month?: number, dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) {
    const from = new Date(dateFrom + 'T00:00:00Z');
    const to = new Date(dateTo + 'T00:00:00Z');
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    return {
      start: businessMonthStart(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
      end: businessMonthStart(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1),
      previousStart: businessMonthStart(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - days),
    };
  }
  const boundary = businessMonthStart;
  return {
    start: boundary(year, month ? month - 1 : 0),
    end: boundary(month ? year : year + 1, month ?? 0),
    previousStart: boundary(month ? year : year - 1, month ? month - 2 : 0),
  };
}
