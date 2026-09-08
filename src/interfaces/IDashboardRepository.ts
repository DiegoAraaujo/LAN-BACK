export interface DashboardAppointment {
  id: string; customerId: string; customerName: string;
  paidAmount: number; total: number; subtotal: number; discount: number; appointmentDate: Date;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL'; paymentMethod: string | null;
  payments: { method: string | null; appliedCents: number }[];
  items: { serviceId: string | null; professionalId: string | null; serviceName: string; professionalName: string; value: number }[];
}
export interface IDashboardRawData {
  appointments: DashboardAppointment[]; previousAppointments: DashboardAppointment[]; newCustomers: number;
}
export interface IGetDashboardRawDataFilters { userId: string; year: number; month?: number | undefined }
export interface IDashboardRepository {
  getDashboardRawData(filters: IGetDashboardRawDataFilters): Promise<IDashboardRawData>;
}
