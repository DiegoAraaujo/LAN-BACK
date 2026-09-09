import "dotenv/config";
import { financeRoutes } from "./routes/financeRoutes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { usersRoutes } from "./routes/usersRoutes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { sessionsRoutes } from "./routes/authRoutes.js";
import { customersRoutes } from "./routes/customersRoutes.js";
import { ensureAuthenticated } from "./shared/middlewares/ensureAuthenticated.js";
import { servicesRouter } from "./routes/servicesRoutes.js";
import { professionalsRoutes } from "./routes/professionalsRoutes.js";
import { appointmentsRoutes } from "./routes/appointmentsRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { allowedOrigins, browserSecurity } from "./shared/middlewares/browserSecurity.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
// Preflight must finish before rate limiting; error responses need CORS too.
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Protection"],
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: "Too many requests. Please try again later.",
        code: "TOO_MANY_REQUESTS",
      });
    },
  }),
);

app.use(browserSecurity);
app.use(express.json());

app.use("/users", usersRoutes);
app.use("/sessions", sessionsRoutes);
app.use("/customers", ensureAuthenticated, customersRoutes);
app.use("/services", ensureAuthenticated, servicesRouter);
app.use("/professionals", ensureAuthenticated, professionalsRoutes);
app.use("/appointments", ensureAuthenticated, appointmentsRoutes);
app.use("/dashboard", ensureAuthenticated, dashboardRoutes);
app.use("/finance", ensureAuthenticated, financeRoutes);

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);

export default app;
