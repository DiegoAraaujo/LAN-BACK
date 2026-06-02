import type { IDashboardRepository } from "../../interfaces/IDashboardRepository.js";

interface IRequest {
  userId: string;
  year: number;
  month?: number | undefined;
}

export class DashboardStats {
  constructor(private dashboardRepository: IDashboardRepository) {}

  async execute({ userId, year, month }: IRequest) {
    const { appointments, servicesData } =
      await this.dashboardRepository.getDashboardRawData({
        userId,
        year,
        month,
      });

    const totalAppointments = appointments.length;
    const totalRevenue = appointments.reduce((sum, app) => sum + app.total, 0);

    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const evolutionGraph = monthNames.map((name) => ({
      month: name,
      revenue: 0,
    }));

    appointments.forEach((app) => {
      const appMonth = new Date(app.appointmentDate).getMonth();

      if (evolutionGraph[appMonth]) {
        evolutionGraph[appMonth].revenue += app.total;
      }
    });

    evolutionGraph.forEach((item) => {
      item.revenue = Number(item.revenue.toFixed(2));
    });

    const servicesPieGraph = servicesData.map((item) => ({
      serviceName: item.serviceName,
      revenue: Number(item.totalRevenue.toFixed(2)),
    }));

    return {
      cards: {
        totalAppointments,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
      evolutionGraph,
      servicesPieGraph,
    };
  }
}
