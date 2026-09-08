import type { IDashboardRepository, IGetDashboardRawDataFilters, DashboardAppointment } from '../../interfaces/IDashboardRepository.js';
import { prisma } from '../../shared/database/prisma.js';
import { dashboardPeriod } from './dashboardPeriod.js';

export class DashboardRepository implements IDashboardRepository {
  async getDashboardRawData({ userId, year, month }: IGetDashboardRawDataFilters) {
    const { start, end, previousStart } = dashboardPeriod(year, month);
    const [rows, newCustomers] = await prisma.$transaction([
      prisma.appointment.findMany({
        where: { userId, deletedAt: null, appointmentDate: { gte: previousStart, lt: end } },
        select: {
          id: true, customerId: true, total: true, paidAmount: true, subtotal: true, discount: true,
          appointmentDate: true, paymentStatus: true, paymentMethod: true,
          customer: { select: { name: true } },
          financeEntries: { where: { kind: "PAYMENT", status: "POSTED", reversal: null }, select: { method: true, appliedCents: true, creditCents: true } },
          items: { select: { serviceId: true, professionalId: true, serviceName: true, professionalName: true, value: true } },
        },
        orderBy: [{ appointmentDate: 'desc' }, { id: 'asc' }],
      }),
      prisma.customer.count({ where: { userId, deletedAt: null, createdAt: { gte: start, lt: end } } }),
    ]);
    const normalized: DashboardAppointment[] = rows.map(({ customer, financeEntries, ...row }) => ({
      ...row, payments: financeEntries.flatMap(entry => {
        const usedCredit = Math.max(0, -entry.creditCents);
        return [{ method: entry.method, appliedCents: entry.appliedCents - usedCredit }, ...(usedCredit ? [{ method: 'CUSTOMER_CREDIT', appliedCents: usedCredit }] : [])].filter(p => p.appliedCents > 0);
      }), paidAmount: Number(row.paidAmount), customerName: customer.name, total: Number(row.total), subtotal: Number(row.subtotal),
      discount: Number(row.discount), items: row.items.map(item => ({ ...item, value: Number(item.value) })),
    }));
    return { appointments: normalized.filter(a => a.appointmentDate >= start),
      previousAppointments: normalized.filter(a => a.appointmentDate < start), newCustomers };
  }
}
