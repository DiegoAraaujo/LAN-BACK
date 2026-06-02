import type {
  IAppointmentsRepository,
  ICreateAppointmentItemInput,
} from "../../../interfaces/IAppointmentsRepository.js";
import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";
import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { Appointment } from "../AppointmentsEntity.js";

interface IRequest {
  userId: string;
  customerId: string;
  registeredById: string;
  appointmentDate: string | Date;
  discount: number;
  paymentStatus: "PAID" | "PENDING";
  paymentMethod?:
    | "DEBIT_CARD"
    | "CREDIT_CARD"
    | "CASH"
    | "PIX"
    | "OTHER"
    | null;
  notes?: string | null | undefined;
  items: {
    serviceId: string;
    professionalId: string;
  }[];
}

export class CreateAppointment {
  constructor(
    private appointmentsRepository: IAppointmentsRepository,
    private servicesRepository: IServicesRepository,
    private professionalsRepository: IProfessionalsRepository,
    private customersRepository: ICustomersRepository,
  ) {}

  async execute(input: IRequest): Promise<Appointment> {
    if (!input.items || input.items.length === 0) {
      throw new AppError(
        "An appointment must have at least one service item.",
        400,
        "MIN_ITEMS_REQUIRED",
      );
    }

    const customer = await this.customersRepository.findById(
      input.customerId,
      input.userId,
    );

    if (!customer) {
      throw new AppError(
        `Customer with ID ${input.customerId} not found.`,
        404,
        "CUSTOMER_NOT_FOUND",
      );
    }

    const serviceIds = input.items.map((i) => i.serviceId);
    const professionalIds = input.items.map((i) => i.professionalId);

    const [services, professionals] = await Promise.all([
      this.servicesRepository.findManyByIds(serviceIds, input.userId),
      this.professionalsRepository.findManyByIds(professionalIds, input.userId),
    ]);

    const servicesMap = new Map(services.map((s) => [s.id, s]));
    const professionalsMap = new Map(professionals.map((p) => [p.id, p]));

    const preparedItems: ICreateAppointmentItemInput[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const service = servicesMap.get(item.serviceId);
      if (!service) {
        throw new AppError(
          `Service with ID ${item.serviceId} not found.`,
          404,
          "SERVICE_NOT_FOUND",
        );
      }

      const professional = professionalsMap.get(item.professionalId);
      if (!professional) {
        throw new AppError(
          `Professional with ID ${item.professionalId} not found.`,
          404,
          "PROFESSIONAL_NOT_FOUND",
        );
      }

      const professionalHandlesService = professional.servicesIds?.includes(
        item.serviceId,
      );
      if (!professionalHandlesService) {
        throw new AppError(
          `Professional with ID ${item.professionalId} does not provide the service with ID ${item.serviceId}.`,
          400,
          "PROFESSIONAL_SERVICE_MISMATCH",
        );
      }

      subtotal += Number(service.price);

      preparedItems.push({
        serviceId: item.serviceId,
        professionalId: item.professionalId,
        serviceName: service.name,
        professionalName: professional.name,
        value: Number(service.price),
      });
    }

    if (input.discount > subtotal) {
      throw new AppError(
        "Discount cannot be greater than the subtotal.",
        400,
        "INVALID_DISCOUNT",
      );
    }

    const total = subtotal - input.discount;

    const appointment = new Appointment({
      userId: input.userId,
      customerId: input.customerId,
      registeredById: input.registeredById,
      appointmentDate: new Date(input.appointmentDate),
      subtotal,
      discount: input.discount,
      total,
      paymentStatus: input.paymentStatus,
      paymentMethod:
        (input.paymentStatus === "PENDING" ? null : input.paymentMethod) ??
        null,
      notes: input.notes ?? null,
    });

    return await this.appointmentsRepository.create(appointment, preparedItems);
  }
}
