import { Router } from "express";
import { servicesController } from "../domain/services/servicesFactory.js";

const servicesRouter = Router();

servicesRouter.post("/", (req, res) => servicesController.create(req, res));
servicesRouter.get("/", (req, res) => servicesController.list(req, res));
servicesRouter.patch("/:id", (req, res) => servicesController.update(req, res));
servicesRouter.delete("/:id", (req, res) =>
  servicesController.remove(req, res),
);
servicesRouter.get("/professional/:professionalId", (req, res) =>
  servicesController.listByProfessional(req, res),
);

export { servicesRouter };
