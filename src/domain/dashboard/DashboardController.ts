import type { Request, Response } from "express";
import type { DashboardStats } from "./DashboardService.js";

export class DashboardController {
  constructor(private getDashboardStatsService: DashboardStats) {}

  async execute(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id;
    const { year, month } = req.query;

    const currentYear = new Date().getFullYear();

    const stats = await this.getDashboardStatsService.execute({
      userId,
      year: year ? Number(year) : currentYear,
      month: month ? Number(month) : undefined,
    });

    return res.status(200).json(stats);
  }
}
