import type {
  IAppointmentsRepository,
  ICreateAppointmentItemInput,
} from "../../../interfaces/IAppointmentsRepository.js";
import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { Appointment } from "../AppointmentsEntity.js";

interface IRequest {
  id: string;
  userId: string;
  appointmentDate?: string | Date | undefined;
  discount?: number | undefined;
  paymentStatus?: "PAID" | "PENDING" | undefined;
  paymentMethod?:
    | "DEBIT_CARD"
    | "CREDIT_CARD"
    | "CASH"
    | "PIX"
    | "OTHER"
    | null
    | undefined;
  notes?: string | null | undefined;
  items?:
    | {
        serviceId: string;
        professionalId: string;
      }[]
    | undefined;
}

export class UpdateAppointment {
  constructor(
    private appointmentsRepository: IAppointmentsRepository,
    private servicesRepository: IServicesRepository,
    private professionalsRepository: IProfessionalsRepository,
  ) {}

  async execute(input: IRequest): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findById(
      input.id,
      input.userId,
    );

    if (!appointment) {
      throw new AppError(
        `Appointment with ID ${input.id} not found.`,
        404,
        "APPOINTMENT_NOT_FOUND",
      );
    }

    let subtotal = appointment.subtotal;
    let preparedItems: ICreateAppointmentItemInput[] | undefined = undefined;

    if (input.items && input.items.length > 0) {
      preparedItems = [];
      subtotal = 0;

      for (const item of input.items) {
        const service = await this.servicesRepository.findById(
          item.serviceId,
          input.userId,
        );
        if (!service)
          throw new AppError(
            `Service ${item.serviceId} not found.`,
            404,
            "SERVICE_NOT_FOUND",
          );

        const professional = await this.professionalsRepository.findById(
          item.professionalId,
          input.userId,
        );
        if (!professional)
          throw new AppError(
            `Professional ${item.professionalId} not found.`,
            404,
            "PROFESSIONAL_NOT_FOUND",
          );

        const professionalHandlesService =
          await this.professionalsRepository.hasService(
            item.professionalId,
            item.serviceId,
          );
        if (!professionalHandlesService)
          throw new AppError(
            "Professional does not provide this service.",
            400,
            "PROFESSIONAL_SERVICE_MISMATCH",
          );

        subtotal += Number(service.price);

        preparedItems.push({
          serviceId: item.serviceId,
          professionalId: item.professionalId,
          serviceName: service.name,
          professionalName: professional.name,
          value: Number(service.price),
        });
      }

      appointment.subtotal = subtotal;
    }

    if (
      input.discount !== undefined &&
      input.discount !== appointment.discount
    ) {
      if (input.discount < 0 || input.discount > subtotal) {
        throw new AppError(
          "Discount must be between 0 and the subtotal.",
          400,
          "INVALID_DISCOUNT",
        );
      }
      appointment.discount = input.discount;
    }

    if (appointment.discount < 0 || appointment.discount > subtotal) {
      throw new AppError('Discount must be between 0 and the subtotal.', 400, 'INVALID_DISCOUNT');
    }
    appointment.total = Math.round((subtotal - appointment.discount) * 100) / 100;

    if (input.appointmentDate) {
      appointment.appointmentDate = new Date(input.appointmentDate);
    }

    if (
      input.paymentStatus &&
      input.paymentStatus !== appointment.paymentStatus
    ) {
      appointment.paymentStatus = input.paymentStatus;
    }

    const finalStatus = input.paymentStatus ?? appointment.paymentStatus;

    if (finalStatus === "PENDING") {
      appointment.paymentMethod = null;
    } else if (input.paymentMethod !== undefined) {
      appointment.paymentMethod = input.paymentMethod;
    }

    if (input.notes !== undefined) {
      appointment.notes = input.notes;
    }

    return await this.appointmentsRepository.update(appointment, preparedItems);
  }
}
