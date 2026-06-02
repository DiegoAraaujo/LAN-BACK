export interface IDashboardRawData {
  appointments: {
    total: number;
    appointmentDate: Date;
  }[];
  servicesData: {
    serviceName: string;
    totalRevenue: number;
  }[];
}

export interface IGetDashboardRawDataFilters {
  userId: string;
  year: number;
  month?: number | undefined;
}

export interface IDashboardRepository {
  getDashboardRawData(filters: IGetDashboardRawDataFilters): Promise<IDashboardRawData>;
}