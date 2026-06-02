import "dotenv/config";
import express from "express";
import cors from "cors";
import { usersRoutes } from "./routes/usersRoutes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { sessionsRoutes } from "./routes/authRoutes.js";
import { customersRoutes } from "./routes/customersRoutes.js";
import { ensureAuthenticated } from "./shared/middlewares/ensureAuthenticated.js";
import { servicesRouter } from "./routes/servicesRoutes.js";
import { professionalsRoutes } from "./routes/professionalsRoutes.js";
import { appointmentsRoutes } from "./routes/appointmentsRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
  }),
);

app.use(express.json());

app.use("/users", usersRoutes);
app.use("/sessions", sessionsRoutes);
app.use("/customers", ensureAuthenticated, customersRoutes);
app.use("/services", ensureAuthenticated, servicesRouter);
app.use("/professionals", ensureAuthenticated, professionalsRoutes);
app.use("/appointments", ensureAuthenticated, appointmentsRoutes);
app.use("/dashboard", ensureAuthenticated, dashboardRoutes);

app.use(errorHandler);

export default app;
