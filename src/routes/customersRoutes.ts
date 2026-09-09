import { Router } from "express";
import { customersController } from "../domain/customers/customerFactory.js";

const customersRoutes = Router();

customersRoutes.post("/", (req, res) => customersController.create(req, res));
customersRoutes.get("/", (req, res) => customersController.list(req, res));
customersRoutes.get("/dashboard", (req, res) =>
  customersController.dashboard(req, res),
);
customersRoutes.get("/loyalty", (req, res) =>
  customersController.loyalty(req, res),
);
customersRoutes.patch("/:id", (req, res) =>
  customersController.update(req, res),
);
customersRoutes.delete("/:id", (req, res) =>
  customersController.remove(req, res),
);
export { customersRoutes };
