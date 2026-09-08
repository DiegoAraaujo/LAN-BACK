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
          id: true, customerId: true, total: true, subtotal: true, discount: true,
          appointmentDate: true, paymentStatus: true, paymentMethod: true,
          customer: { select: { name: true } },
          items: { select: { serviceId: true, professionalId: true, serviceName: true, professionalName: true, value: true } },
        },
        orderBy: [{ appointmentDate: 'desc' }, { id: 'asc' }],
      }),
      prisma.customer.count({ where: { userId, deletedAt: null, createdAt: { gte: start, lt: end } } }),
    ]);
    const normalized: DashboardAppointment[] = rows.map(({ customer, ...row }) => ({
      ...row, customerName: customer.name, total: Number(row.total), subtotal: Number(row.subtotal),
      discount: Number(row.discount), items: row.items.map(item => ({ ...item, value: Number(item.value) })),
    }));
    return { appointments: normalized.filter(a => a.appointmentDate >= start),
      previousAppointments: normalized.filter(a => a.appointmentDate < start), newCustomers };
  }
}
