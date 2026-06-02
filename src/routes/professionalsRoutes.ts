import { Router } from "express";
import { professionalsController } from "../domain/professionals/professionalsFactory.js";

const professionalsRoutes = Router();

professionalsRoutes.post("/", (req, res) =>
  professionalsController.create(req, res),
);
professionalsRoutes.get("/", (req, res) =>
  professionalsController.list(req, res),
);

professionalsRoutes.get("/service/:id", (req, res) =>
  professionalsController.listProfessionalsByService(req, res),
);

professionalsRoutes.patch("/:id", (req, res) =>
  professionalsController.update(req, res),
);
professionalsRoutes.delete("/:id", (req, res) =>
  professionalsController.remove(req, res),
);

export { professionalsRoutes };
