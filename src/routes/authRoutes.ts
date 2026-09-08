import { Router } from "express";
import { authController } from "../domain/auth/AuthFactory.js";

const sessionsRoutes = Router();
sessionsRoutes.post("/logout", (req, res) => authController.logout(req, res));

sessionsRoutes.post("/", (req, res) => authController.login(req, res));
sessionsRoutes.post("/refresh-token", (req, res) =>
  authController.createRefreshToken(req, res),
);

export { sessionsRoutes };
