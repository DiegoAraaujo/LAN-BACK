import { Router } from "express";
import { appointmentsController } from "../domain/appointments/appointmentsFactory.js";

export const appointmentsRoutes = Router();

appointmentsRoutes.get("/", (req, res) =>
  appointmentsController.list(req, res),
);

appointmentsRoutes.post("/", (req, res) =>
  appointmentsController.create(req, res),
);

appointmentsRoutes.patch("/:id", (req, res) =>
  appointmentsController.update(req, res),
);

appointmentsRoutes.delete("/:id", (req, res) =>
  appointmentsController.remove(req, res),
);
