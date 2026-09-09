import type { IDashboardRepository, IGetDashboardRawDataFilters, DashboardAppointment } from '../../interfaces/IDashboardRepository.js';
import { businessDateParts } from './dashboardPeriod.js';

const cents = (n: number) => Math.round(n * 100);
const money = (n: number) => n / 100;
function summary(rows: DashboardAppointment[]) {
  const paid = rows.filter(a => a.paymentStatus === 'PAID');
  const pending = rows.filter(a => a.paymentStatus !== 'PAID');
  const paidCents = rows.reduce((s, a) => s + cents(a.paidAmount), 0);
  const pendingCents = rows.reduce((s, a) => s + cents(a.total) - cents(a.paidAmount), 0);
  return { totalAppointments: rows.length, paidCount: paid.length, pendingCount: pending.length,
    totalRevenue: money(paidCents), pendingRevenue: money(pendingCents), totalValue: money(paidCents + pendingCents),
    averageTicket: paid.length ? money(Math.round(paid.reduce((sum,a) => sum+cents(a.total),0) / paid.length)) : 0 };
}
export class DashboardStats {
  constructor(private dashboardRepository: IDashboardRepository) {}
  async execute(filters: IGetDashboardRawDataFilters) {
    const { appointments, previousAppointments, newCustomers } = await this.dashboardRepository.getDashboardRawData(filters);
    const cards = { ...summary(appointments), newCustomers };
    const previous = summary(previousAppointments);
    const change = (now: number, before: number) => before === 0 ? null : Math.round((now - before) / before * 1000) / 10;
    const custom = !!(filters.dateFrom && filters.dateTo);
    const rangeStart = custom ? new Date(filters.dateFrom! + 'T00:00:00Z') : null;
    const rangeEnd = custom ? new Date(filters.dateTo! + 'T00:00:00Z') : null;
    const monthly = !!(rangeStart && rangeEnd && (rangeEnd.getTime() - rangeStart.getTime()) / 86400000 >= 92);
    const customBuckets: { month: string; revenue: number; pending: number }[] = [];
    if (rangeStart && rangeEnd) {
      const cursor = new Date(rangeStart);
      if (monthly) cursor.setUTCDate(1);
      while (cursor <= rangeEnd) {
        customBuckets.push({ month: cursor.toISOString().slice(0, monthly ? 7 : 10), revenue: 0, pending: 0 });
        if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        else cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    const evolutionGraph = custom ? customBuckets : Array.from({ length: filters.month ? new Date(Date.UTC(filters.year, filters.month, 0)).getUTCDate() : 12 }, (_, i) => ({
      month: String(i + 1), revenue: 0, pending: 0,
    }));
    const bucketsByDate = new Map(evolutionGraph.map(bucket => [bucket.month, bucket]));
    const services = new Map<string, { serviceName: string; count: number; revenue: number }>();
    const professionals = new Map<string, { name: string; count: number; revenue: number; ids: Set<string> }>();
    const customers = new Map<string, { name: string; count: number; revenue: number }>();
    const payments = new Map<string, { method: string; count: number; revenue: number }>();
    for (const a of appointments) {
      const local = businessDateParts(a.appointmentDate);
      const keyDate = `${local.year}-${String(local.month).padStart(2, '0')}${monthly ? '' : '-' + String(local.day).padStart(2, '0')}`;
      const bucket = custom ? bucketsByDate.get(keyDate) : evolutionGraph[filters.month ? local.day - 1 : local.month - 1];
      if (bucket) { bucket.revenue += cents(a.paidAmount); bucket.pending += cents(a.total)-cents(a.paidAmount); }
      const customer = customers.get(a.customerId) ?? { name: a.customerName, count: 0, revenue: 0 };
      customer.count++;
      customer.revenue += cents(a.paidAmount);
      customers.set(a.customerId, customer);
      for (const entry of a.payments) {
        const method = entry.method ?? 'CUSTOMER_CREDIT';
        const payment = payments.get(method) ?? { method, count: 0, revenue: 0 };
        payment.count++; payment.revenue += entry.appliedCents; payments.set(method, payment);
      }
      // Allocate net revenue in integer cents and distribute the rounding remainder.
      const weights = a.items.map(i => cents(i.value));
      const weightTotal = weights.reduce((s, n) => s + n, 0);
      const allocations = weights.map(w => weightTotal ? Math.floor(cents(a.paidAmount) * w / weightTotal) : 0);
      let remainder = cents(a.paidAmount) - allocations.reduce((s, n) => s + n, 0);
      for (let i = 0; remainder > 0 && allocations.length; i = (i + 1) % allocations.length) {
        allocations[i] = (allocations[i] ?? 0) + 1; remainder--;
      }
      a.items.forEach((item, index) => {
        const net = allocations[index] ?? 0;
        const key = item.serviceId ?? item.serviceName;
        const service = services.get(key) ?? { serviceName: item.serviceName, count: 0, revenue: 0 };
        service.count++; service.revenue += net; services.set(key, service);
        const proKey = item.professionalId ?? item.professionalName;
        const pro = professionals.get(proKey) ?? { name: item.professionalName, count: 0, revenue: 0, ids: new Set<string>() };
        pro.ids.add(a.id); pro.count = pro.ids.size; pro.revenue += net; professionals.set(proKey, pro);
      });
    }
    const rank = <T extends { revenue: number; count: number }>(rows: T[]) => rows.sort((a,b) => b.revenue - a.revenue || b.count - a.count).map(r => ({ ...r, revenue: money(r.revenue) }));
    const compact = (a: DashboardAppointment) => ({ id: a.id, customerId: a.customerId, customerName: a.customerName, appointmentDate: a.appointmentDate, total: a.total, paidAmount: a.paidAmount, remaining: a.total-a.paidAmount, paymentStatus: a.paymentStatus, services: a.items.map(i => i.serviceName) });
    return {
      cards, previous, comparison: { totalValue: change(cards.totalValue, previous.totalValue), revenue: change(cards.totalRevenue, previous.totalRevenue), appointments: change(cards.totalAppointments, previous.totalAppointments), averageTicket: change(cards.averageTicket, previous.averageTicket) },
      evolutionGraph: evolutionGraph.map(b => ({ ...b, revenue: money(b.revenue), pending: money(b.pending) })),
      servicesPieGraph: rank([...services.values()]),
      professionals: rank([...professionals.values()].map(p => ({ name: p.name, count: p.count, revenue: p.revenue }))).slice(0, 5),
      customers: [...customers.values()].sort((a,b) => b.count - a.count || b.revenue - a.revenue).slice(0, 5).map(c => ({ ...c, revenue: money(c.revenue) })),
      paymentMethods: rank([...payments.values()]),
      recentAppointments: appointments.slice(0, 5).map(compact),
      pendingAppointments: appointments.filter(a => a.paymentStatus !== 'PAID').sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()).slice(0, 5).map(compact),
    };
  }
}
