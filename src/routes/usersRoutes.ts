import { Router } from "express";

import { ensureAuthenticated } from "../shared/middlewares/ensureAuthenticated.js";
import { usersController } from "../domain/users/usersFactory.js";

const usersRoutes = Router();

usersRoutes.post("/", (req, res) => usersController.create(req, res));

usersRoutes.patch("/", ensureAuthenticated, (req, res) =>
  usersController.update(req, res),
);

export { usersRoutes };
