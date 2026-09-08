import { Router } from "express";
import { z } from "zod";
import { financeService, paymentSchema, entrySchema, settlementSchema, methodSchema } from "../domain/finance/FinanceService.js";
import { dateRange } from "../domain/finance/appointmentSearch.js";
export const financeRoutes = Router();
const id = z.string().uuid();
financeRoutes.get("/", async (req, res) => {
  const q = z.object({ from: z.string().date(), to: z.string().date(), page: z.coerce.number().int().min(1).max(100000).default(1),
    kind: z.enum(["PAYMENT", "CREDIT", "INCOME", "EXPENSE", "OPENING", "REVERSAL"]).optional(), method: methodSchema.optional(), status: z.enum(["POSTED", "PENDING", "CANCELLED"]).optional(),
  }).refine(v => v.from <= v.to, "Período inválido.").parse(req.query);
  const dates = dateRange(q.from, q.to);
  res.json(await financeService.list(req.user.id, dates.gte!, dates.lt!, q.page, q.kind, q.method, q.status));
});
financeRoutes.get("/customers/:id", async (req,res) => { res.json(await financeService.customer(req.user.id, id.parse(req.params.id))); });
financeRoutes.post("/appointments/:id/payments", async (req,res) => { res.status(201).json(await financeService.pay(req.user.id, id.parse(req.params.id), paymentSchema.parse(req.body))); });
financeRoutes.post("/", async (req,res) => { res.status(201).json(await financeService.create(req.user.id, entrySchema.parse(req.body))); });
financeRoutes.post("/:id/settle", async (req,res) => { res.json(await financeService.settle(req.user.id, id.parse(req.params.id), settlementSchema.parse(req.body).occurredAt)); });
financeRoutes.post("/:id/reverse", async (req,res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3).max(200) }).parse(req.body);
  res.json(await financeService.reverse(req.user.id, id.parse(req.params.id), reason));
});
