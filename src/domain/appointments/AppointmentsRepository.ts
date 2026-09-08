import { financeTransaction, syncAppointment, cents } from "../finance/FinanceService.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { Prisma } from "@prisma/client";
import type {
  IAppointmentsRepository,
  ICreateAppointmentItemInput,
  IFindManyAppointmentsFilters,
  ISearchWithFiltersResponse,
} from "../../interfaces/IAppointmentsRepository.js";
import { prisma } from "../../shared/database/prisma.js";
import { Appointment } from "./AppointmentsEntity.js";
import { businessMonthStart } from '../dashboard/dashboardPeriod.js';

export class AppointmentsRepository implements IAppointmentsRepository {
  async create(
    appointment: Appointment,
    items: ICreateAppointmentItemInput[],
  ): Promise<Appointment> {
    const created = await financeTransaction(appointment.userId, async tx => {
    if (!await tx.customer.findFirst({ where: { id: appointment.customerId, userId: appointment.userId, deletedAt: null } })) {
      throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
    }
    const row = await tx.appointment.create({
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

    if (appointment.paymentStatus === "PAID" && cents(appointment.total) > 0) {
      await tx.financeEntry.create({ data: { userId: appointment.userId, customerId: appointment.customerId, appointmentId: row.id, kind: "PAYMENT", description: "Pagamento no cadastro", category: "Atendimentos", cashCents: cents(appointment.total), appliedCents: cents(appointment.total), method: appointment.paymentMethod ?? "OTHER", occurredAt: new Date(), requestId: `initial:${row.id}` } });
    }
    return syncAppointment(tx, appointment.userId, row.id);
    });

    return new Appointment({
      ...created,
      subtotal: Number(created.subtotal),
      discount: Number(created.discount),
      total: Number(created.total),
      paidAmount: Number(created.paidAmount),
    });
  }
  async update(
    appointment: Appointment,
    items?: ICreateAppointmentItemInput[],
  ): Promise<Appointment> {
    const updated = await financeTransaction(appointment.userId, async tx => {
    const current = await tx.appointment.findFirst({ where: { id: appointment.id, userId: appointment.userId, deletedAt: null } });
    if (!current) throw new AppError("Atendimento não encontrado.", 404, "APPOINTMENT_NOT_FOUND");
    if (cents(current.paidAmount) > cents(appointment.total)) throw new AppError("Estorne pagamentos antes de reduzir o total.", 409, "PAYMENT_CONFLICT");
    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        customerId: appointment.customerId,
        appointmentDate: appointment.appointmentDate,
        subtotal: appointment.subtotal,
        discount: appointment.discount,
        total: appointment.total,
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

    return syncAppointment(tx, appointment.userId, appointment.id);
    });
    return new Appointment({
      ...updated,
      subtotal: Number(updated.subtotal),
      discount: Number(updated.discount),
      total: Number(updated.total),
      paidAmount: Number(updated.paidAmount),
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
      paidAmount: Number(appointment.paidAmount),
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

      const startDate = businessMonthStart(startYear, startMonth);
      const endDate = businessMonthStart(endYear, endMonth);

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
      paidAmount: Number(appointment.paidAmount),
          paymentStatus: appointment.paymentStatus,
          paymentMethod: appointment.paymentMethod,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          deletedAt: appointment.deletedAt,
        });

        return {
          appointment: appointmentEntity,
          customerName: appointment.customer.name,
          items: appointment.items.map((item) => ({
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            professionalId: item.professionalId,
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
    const found = await prisma.appointment.findUnique({ where: { id } });
    if (!found) return;
    await financeTransaction(found.userId, async tx => {
      const count = await tx.financeEntry.count({ where: { appointmentId: id } });
      if (count) throw new AppError("Atendimentos com histórico financeiro não podem ser excluídos.", 409, "PAYMENT_CONFLICT");
      await tx.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  }
}
