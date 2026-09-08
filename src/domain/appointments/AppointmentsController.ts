import { z } from 'zod';
import type { Request, Response } from "express";
import type { CreateAppointment } from "./services/CreateAppointment.js";
import type { UpdateAppointment } from "./services/UpdateAppointment.js";
import type { RemoveAppointment } from "./services/RemoveAppointment.js";
import {
  createAppointmentBodySchema,
  updateAppointmentBodySchema,
} from "./appointmentsSchema.js";
import { AppointmentMapper } from "./AppointmentsMapper.js";
import type { ListAppointments } from "./services/ListAppointments.js";

export class AppointmentsController {
  constructor(
    private createAppointmentService: CreateAppointment,
    private updateAppointmentService: UpdateAppointment,
    private removeAppointmentService: RemoveAppointment,
    private listAppointmentsService: ListAppointments,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const data = createAppointmentBodySchema.parse(req.body);

    const userId = req.user.id;
    const registeredById = req.user.id;

    const appointment = await this.createAppointmentService.execute({
      userId,
      registeredById,
      customerId: data.customerId,
      appointmentDate: data.appointmentDate,
      discount: data.discount,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes,
      items: data.items,
    });

    return res.status(201).json(AppointmentMapper.toResponse(appointment));
  }

  async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user.id;

    const data = updateAppointmentBodySchema.parse(req.body);

    const appointment = await this.updateAppointmentService.execute({
      id,
      userId,
      ...data,
    });

    return res.status(200).json(AppointmentMapper.toResponse(appointment));
  }

  async list(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;

    const { search, paymentStatus, year, month, page, limit } = z.object({
      search: z.string().max(200).optional(), paymentStatus: z.enum(['PAID', 'PENDING']).optional(),
      year: z.coerce.number().int().min(2000).max(2100).optional(), month: z.coerce.number().int().min(1).max(12).optional(),
      page: z.coerce.number().int().min(1).max(100000).optional(), limit: z.coerce.number().int().min(1).max(100).optional(),
    }).parse(req.query);

    const { data, total, totalPending } =
      await this.listAppointmentsService.execute({
        userId,
        search: search ? String(search) : undefined,
        paymentStatus: paymentStatus
          ? (paymentStatus as "PAID" | "PENDING")
          : undefined,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

    const formattedData = data.map((item) => {
      return {
        ...AppointmentMapper.toResponse(item.appointment),

        customerName: item.customerName,
        items: item.items,
      };
    });

    return res.status(200).json({
      data: formattedData,
      total,
      totalPending,
    });
  }

  async remove(req: Request<{ id: string }>, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user.id;

    await this.removeAppointmentService.execute({
      id,
      userId,
    });

    return res.sendStatus(204);
  }
}
