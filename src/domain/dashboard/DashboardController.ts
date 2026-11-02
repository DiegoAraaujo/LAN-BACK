import type { Request, Response } from 'express';
import type { DashboardStats } from './DashboardService.js';
import { dashboardQuerySchema } from '../../shared/validation/queries.js';

export class DashboardController {
  constructor(private getDashboardStatsService: DashboardStats) {}

  async execute(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;
    const { year, month, dateFrom, dateTo } = dashboardQuerySchema.parse(req.query);

    const currentYear = new Date().getFullYear();

    const stats = await this.getDashboardStatsService.execute({
      userId,
      year: year ? Number(year) : currentYear,
      month: month ? Number(month) : undefined,
      dateFrom,
      dateTo,
    });

    return res.status(200).json(stats);
  }
}
