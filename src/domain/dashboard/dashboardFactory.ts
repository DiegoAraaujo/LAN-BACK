import { DashboardController } from "./DashboardController.js";
import { DashboardRepository } from "./DashboardRepository.js";
import { DashboardStats } from "./DashboardService.js";

const dashboardRepository = new DashboardRepository();

const dashboardService = new DashboardStats(dashboardRepository);

export const dashboardController = new DashboardController(dashboardService);
