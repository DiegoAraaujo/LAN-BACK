import type { Request, Response } from "express";
import type { DashboardStats } from "./DashboardService.js";
import { z } from 'zod';

export class DashboardController {
  constructor(private getDashboardStatsService: DashboardStats) {}

  async execute(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;
    const date = z.iso.date().refine(value => value >= '2000-01-01' && value <= '2100-12-31', 'Date out of range');
    const { year, month, dateFrom, dateTo } = z.object({
      year: z.coerce.number().int().min(2000).max(2100).optional(),
      month: z.coerce.number().int().min(1).max(12).optional(),
      dateFrom: date.optional(), dateTo: date.optional(),
    }).refine(value => (!value.dateFrom && !value.dateTo) || (!!value.dateFrom && !!value.dateTo && value.dateFrom <= value.dateTo), 'Provide a valid date range').parse(req.query);

    const currentYear = new Date().getFullYear();

    const stats = await this.getDashboardStatsService.execute({
      userId,
      year: year ? Number(year) : currentYear,
      month: month ? Number(month) : undefined,
      dateFrom, dateTo,
    });

    return res.status(200).json(stats);
  }
}
