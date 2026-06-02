import type { Prisma } from "@prisma/client";
import type {
  IAppointmentsRepository,
  ICreateAppointmentItemInput,
  IFindManyAppointmentsFilters,
  ISearchWithFiltersResponse,
} from "../../interfaces/IAppointmentsRepository.js";
import { prisma } from "../../shared/database/prisma.js";
import { Appointment } from "./AppointmentsEntity.js";

export class AppointmentsRepository implements IAppointmentsRepository {
  async create(
    appointment: Appointment,
    items: ICreateAppointmentItemInput[],
  ): Promise<Appointment> {
    const created = await prisma.appointment.create({
      data: {
        userId: appointment.userId,
        customerId: appointment.customerId,
        registeredById: appointment.registeredById,
        appointmentDate: appointment.appointmentDate,
        subtotal: appointment.subtotal,
        discount: appointment.discount,
        total: appointment.total,
        paymentStatus: appointment.paymentStatus,
        paymentMethod: appointment.paymentMethod,
        notes: appointment.notes,

        items: {
          createMany: {
            data: items.map((item) => ({
              serviceId: item.serviceId,
              professionalId: item.professionalId,
              serviceName: item.serviceName,
              professionalName: item.professionalName,
              value: item.value,
            })),
          },
        },
      },
    });

    return new Appointment({
      ...created,
      subtotal: Number(created.subtotal),
      discount: Number(created.discount),
      total: Number(created.total),
    });
  }
  async update(
    appointment: Appointment,
    items?: ICreateAppointmentItemInput[],
  ): Promise<Appointment> {
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        customerId: appointment.customerId,
        appointmentDate: appointment.appointmentDate,
        subtotal: appointment.subtotal,
        discount: appointment.discount,
        total: appointment.total,
        paymentStatus: appointment.paymentStatus,
        paymentMethod: appointment.paymentMethod,
        notes: appointment.notes,

        ...(items && {
          items: {
            deleteMany: {},
            createMany: {
              data: items.map((item) => ({
                serviceId: item.serviceId,
                professionalId: item.professionalId,
                serviceName: item.serviceName,
                professionalName: item.professionalName,
                value: item.value,
              })),
            },
          },
        }),
      },
    });

    return new Appointment({
      ...updated,
      subtotal: Number(updated.subtotal),
      discount: Number(updated.discount),
      total: Number(updated.total),
    });
  }

  async findById(id: string, userId: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!appointment) return null;

    return new Appointment({
      ...appointment,
      subtotal: Number(appointment.subtotal),
      discount: Number(appointment.discount),
      total: Number(appointment.total),
    });
  }

  async searchWithFilters(filters: IFindManyAppointmentsFilters): Promise<{
    data: ISearchWithFiltersResponse[];
    total: number;
    totalPending: number;
  }> {
    const whereClause: Prisma.AppointmentWhereInput = {
      userId: filters.userId,
      deletedAt: null,
    };

    if (filters.search) {
      whereClause.customer = {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      };
    }

    if (filters.paymentStatus) {
      whereClause.paymentStatus = filters.paymentStatus;
    }

    if (filters.year !== undefined || filters.month !== undefined) {
      let startYear = filters.year ?? new Date().getFullYear();
      let startMonth = filters.month !== undefined ? filters.month - 1 : 0;

      let endYear = startYear;
      let endMonth = startMonth + 1;

      if (filters.year !== undefined && filters.month === undefined) {
        startMonth = 0;
        endYear = startYear + 1;
        endMonth = 0;
      }

      if (filters.year === undefined && filters.month !== undefined) {
        startYear = new Date().getFullYear();
        endYear = startYear;
      }

      const startDate = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(endYear, endMonth, 1, 0, 0, 0, 0);

      whereClause.appointmentDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [appointments, total, totalPending] = await prisma.$transaction([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { name: true },
          },
          items: true,
        },
        take: filters.take,
        skip: filters.skip,
        orderBy: { appointmentDate: "desc" },
      }),
      prisma.appointment.count({ where: whereClause }),
      prisma.appointment.count({
        where: { ...whereClause, paymentStatus: "PENDING" },
      }),
    ]);

    const mappedData: ISearchWithFiltersResponse[] = appointments.map(
      (appointment) => {
        const appointmentEntity = new Appointment({
          id: appointment.id,
          userId: appointment.userId,
          customerId: appointment.customerId,
          registeredById: appointment.registeredById,
          appointmentDate: appointment.appointmentDate,
          subtotal: Number(appointment.subtotal),
          discount: Number(appointment.discount),
          total: Number(appointment.total),
          paymentStatus: appointment.paymentStatus,
          paymentMethod: appointment.paymentMethod,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          deletedAt: appointment.deletedAt,
        });

        return {
          appointment: appointmentEntity,
          // 💡 Mapeamento limpo e direto, pois o cliente agora é obrigatório no seu Schema
          customerName: appointment.customer.name,
          items: appointment.items.map((item) => ({
            serviceId: item.serviceId, // Aceita string | null de acordo com o Prisma e a Interface
            serviceName: item.serviceName,
            professionalId: item.professionalId, // Aceita string | null de acordo com o Prisma e a Interface
            professionalName: item.professionalName,
            value: Number(item.value),
          })),
        };
      },
    );

    return {
      data: mappedData,
      total,
      totalPending,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.appointment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
