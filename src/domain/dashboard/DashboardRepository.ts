import type {
  IDashboardRawData,
  IDashboardRepository,
  IGetDashboardRawDataFilters,
} from "../../interfaces/IDashboardRepository.js";
import { prisma } from "../../shared/database/prisma.js";

export class DashboardRepository implements IDashboardRepository {
  async getDashboardRawData({
    userId,
    year,
    month,
  }: IGetDashboardRawDataFilters): Promise<IDashboardRawData> {
    let startQueryDate = new Date(year, 0, 1);
    let endQueryDate = new Date(year + 1, 0, 1);

    if (month) {
      startQueryDate = new Date(year, month - 1, 1);
      endQueryDate = new Date(year, month, 1);
    }

    const appointmentsRaw = await prisma.appointment.findMany({
      where: {
        userId,
        deletedAt: null,
        paymentStatus: "PAID",
        appointmentDate: {
          gte: startQueryDate,
          lt: endQueryDate,
        },
      },
      select: {
        total: true,
        appointmentDate: true,
      },
    });

    const appointments = appointmentsRaw.map((app) => ({
      appointmentDate: app.appointmentDate,
      total: Number(app.total),
    }));

    const groupByServices = await prisma.appointmentItem.groupBy({
      by: ["serviceName"],
      where: {
        appointment: {
          userId,
          deletedAt: null,
          paymentStatus: "PAID",
          appointmentDate: {
            gte: startQueryDate,
            lt: endQueryDate,
          },
        },
      },
      _sum: {
        value: true,
      },
    });

    const servicesData = groupByServices.map((item) => ({
      serviceName: item.serviceName,
      totalRevenue: item._sum.value ? Number(item._sum.value) : 0,
    }));

    return {
      appointments,
      servicesData,
    };
  }
}