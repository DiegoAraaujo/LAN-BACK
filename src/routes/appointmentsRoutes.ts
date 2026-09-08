import { searchAppointments, searchSchema } from "../domain/finance/appointmentSearch.js";
import { Router } from "express";
import { appointmentsController } from "../domain/appointments/appointmentsFactory.js";

export const appointmentsRoutes = Router();

appointmentsRoutes.get("/", async (req, res) => {
  res.json(await searchAppointments(req.user.id, searchSchema.parse(req.query)));
});

appointmentsRoutes.post("/", (req, res) =>
  appointmentsController.create(req, res),
);

appointmentsRoutes.patch("/:id", (req, res) =>
  appointmentsController.update(req, res),
);

appointmentsRoutes.delete("/:id", (req, res) =>
  appointmentsController.remove(req, res),
);
