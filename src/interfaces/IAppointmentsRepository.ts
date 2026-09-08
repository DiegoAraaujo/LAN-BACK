import type { Appointment } from "../domain/appointments/AppointmentsEntity.js";

export interface ICreateAppointmentItemInput {
  serviceId: string;
  professionalId: string;
  serviceName: string;
  professionalName: string;
  value: number;
}

export interface IFindManyAppointmentsFilters {
  userId: string;
  search?: string | undefined;
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL" | undefined;
  year?: number | undefined;
  month?: number | undefined;
  take: number;
  skip: number;
}

export interface ISearchWithFiltersResponse {
  appointment: Appointment;
  customerName: string;
  items: {
    serviceId: string | null;
    serviceName: string;
    professionalId: string | null;
    professionalName: string;
    value: number;
  }[];
}

export interface IAppointmentsRepository {
  create(
    appointment: Appointment,
    items: ICreateAppointmentItemInput[],
  ): Promise<Appointment>;

  update(
    appointment: Appointment,
    items?: ICreateAppointmentItemInput[],
  ): Promise<Appointment>;

  findById(id: string, userId: string): Promise<Appointment | null>;

  delete(id: string): Promise<void>;

  searchWithFilters(
    filters: IFindManyAppointmentsFilters,
  ): Promise<{
    data: ISearchWithFiltersResponse[];
    total: number;
    totalPending: number;
  }>;
}
