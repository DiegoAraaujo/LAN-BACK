import { Router } from "express";
import { dashboardController } from "../domain/dashboard/dashboardFactory.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", (req, res) => dashboardController.execute(req, res));
