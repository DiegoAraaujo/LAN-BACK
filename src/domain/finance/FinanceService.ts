import type { DatabaseTransaction } from "../../shared/database/prisma.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";
import { AppError } from "../../shared/errors/AppError.js";
import { z } from "zod";

export const cents = (value: number | Prisma.Decimal) => Math.round(Number(value) * 100);
export const methodSchema = z.enum(["PIX", "CASH", "DEBIT_CARD", "CREDIT_CARD", "OTHER"]);
const amount = z.number().finite().min(0).max(999999.99).multipleOf(0.01);
const pastDate = z.string().datetime().refine(value => new Date(value).getTime() <= Date.now() + 60000, "Data de recebimento não pode estar no futuro.");
export const paymentSchema = z.object({
  requestId: z.string().uuid(), received: amount.optional(), useCredit: amount.default(0),
  payments: z.array(z.object({ amount: amount.refine(value => value > 0), method: methodSchema })).max(5).optional(),
  excess: z.enum(["CHANGE", "CREDIT"]), method: methodSchema.optional(),
  occurredAt: pastDate, description: z.string().trim().max(300).default("Pagamento de atendimento"),
}).superRefine((data, context) => {
  const payments = data.payments ?? (data.received !== undefined && data.method ? [{ amount: data.received, method: data.method }] : []);
  if (payments.reduce((sum, payment) => sum + payment.amount, 0) + data.useCredit <= 0) context.addIssue({ code: "custom", message: "Informe um pagamento ou crédito." });
  if (new Set(payments.map(payment => payment.method)).size !== payments.length) context.addIssue({ code: "custom", message: "Não repita a mesma forma de pagamento." });
});
export const entrySchema = z.object({
  requestId: z.string().uuid(), kind: z.enum(["INCOME", "EXPENSE", "OPENING", "CREDIT"]),
  amount: amount.refine(value => value > 0), status: z.enum(["POSTED", "PENDING"]).default("POSTED"),
  customerId: z.string().uuid().optional(), description: z.string().trim().min(3).max(300),
  category: z.string().trim().min(2).max(80), method: methodSchema,
  occurredAt: z.string().datetime(),
}).refine(data => data.status === "PENDING" || new Date(data.occurredAt).getTime() <= Date.now() + 60000, "Movimentação paga não pode estar no futuro.")
  .refine(data => !["CREDIT", "OPENING"].includes(data.kind) || data.status === "POSTED", "Crédito e saldo inicial devem estar confirmados.");

export async function financeTransaction<T>(userId: string, work: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
  return prisma.$transaction(async tx => {
    // All financial writes for an account share this lock, including appointment edits.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    return work(tx);
  });
}

async function creditBalance(tx: DatabaseTransaction, userId: string, customerId: string) {
  const sum = await tx.financeEntry.aggregate({ where: { userId, customerId, status: "POSTED" }, _sum: { creditCents: true } });
  return sum._sum.creditCents ?? 0;
}

export async function syncAppointment(tx: DatabaseTransaction, userId: string, id: string) {
  const appointment = await tx.appointment.findFirst({ where: { id, userId, deletedAt: null } });
  if (!appointment) throw new AppError("Atendimento não encontrado.", 404, "APPOINTMENT_NOT_FOUND");
  const sum = await tx.financeEntry.aggregate({ where: { userId, appointmentId: id, status: "POSTED" }, _sum: { appliedCents: true } });
  const paid = sum._sum.appliedCents ?? 0;
  if (paid < 0 || paid > cents(appointment.total)) throw new AppError("Estorne os pagamentos antes de reduzir o valor do atendimento.", 409, "PAYMENT_CONFLICT");
  const last = await tx.financeEntry.findFirst({ where: { userId, appointmentId: id, status: "POSTED", kind: "PAYMENT", reversal: null }, orderBy: { occurredAt: "desc" } });
  return tx.appointment.update({ where: { id }, data: {
    paidAmount: paid / 100, paidAt: last?.occurredAt ?? null,
    paymentStatus: paid >= cents(appointment.total) ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING",
    paymentMethod: last?.method ?? null,
  } });
}

export class FinanceService {
  async pay(userId: string, appointmentId: string, data: z.infer<typeof paymentSchema>) {
    return financeTransaction(userId, async tx => {
      const previous = await tx.financeEntry.findUnique({ where: { userId_requestId: { userId, requestId: data.requestId } } });
      if (previous) {
        if (previous.appointmentId !== appointmentId || previous.kind !== "PAYMENT") throw new AppError("Identificador já utilizado.", 409, "PAYMENT_CONFLICT");
        return previous;
      }
      const appointment = await tx.appointment.findFirst({ where: { id: appointmentId, userId, deletedAt: null } });
      if (!appointment) throw new AppError("Atendimento não encontrado.", 404, "APPOINTMENT_NOT_FOUND");
      const remaining = cents(appointment.total) - cents(appointment.paidAmount);
      const payments = data.payments ?? (data.received !== undefined && data.method ? [{ amount: data.received, method: data.method }] : []);
      const paymentCents = payments.map(payment => ({ method: payment.method, amount: cents(payment.amount) }));
      const credit = cents(data.useCredit), received = paymentCents.reduce((sum, payment) => sum + payment.amount, 0);
      if (remaining <= 0 || credit > remaining || credit > await creditBalance(tx, userId, appointment.customerId)) {
        throw new AppError("Confira o valor em aberto e o crédito disponível.", 409, "PAYMENT_CONFLICT");
      }
      const excess = Math.max(0, received + credit - remaining);
      const netCash = paymentCents.map(payment => ({ ...payment }));
      let changeLeft = data.excess === "CHANGE" ? excess : 0;
      for (let index = netCash.length - 1; index >= 0 && changeLeft > 0; index--) {
        const deduction = Math.min(netCash[index]!.amount, changeLeft);
        netCash[index]!.amount -= deduction;
        changeLeft -= deduction;
      }
      let cashApplicationLeft = Math.max(0, Math.min(received, remaining - credit));
      const plans: { method: z.infer<typeof methodSchema> | null; cashCents: number; creditCents: number; appliedCents: number }[] = [];
      if (credit > 0) plans.push({ method: null, cashCents: 0, creditCents: -credit, appliedCents: credit });
      netCash.forEach(payment => {
        if (payment.amount <= 0) return;
        const appliedCents = Math.min(payment.amount, cashApplicationLeft);
        cashApplicationLeft -= appliedCents;
        plans.push({ method: payment.method, cashCents: payment.amount, creditCents: 0, appliedCents });
      });
      if (data.excess === "CREDIT" && excess > 0) plans[plans.length - 1]!.creditCents += excess;
      const entries = [];
      for (let index = 0; index < plans.length; index++) {
        const plan = plans[index]!;
        entries.push(await tx.financeEntry.create({ data: {
          userId, customerId: appointment.customerId, appointmentId, requestId: index === 0 ? data.requestId : `${data.requestId}:${index}`,
          kind: "PAYMENT", description: data.description, category: "Atendimentos",
          ...plan, occurredAt: new Date(data.occurredAt),
        } }));
      }
      await syncAppointment(tx, userId, appointmentId);
      return { entries, change: data.excess === "CHANGE" ? excess / 100 : 0 };
    });
  }

  async create(userId: string, data: z.infer<typeof entrySchema>) {
    return financeTransaction(userId, async tx => {
      const previous = await tx.financeEntry.findUnique({ where: { userId_requestId: { userId, requestId: data.requestId } } });
      if (previous) return previous;
      if (data.kind === "CREDIT") {
        if (!data.customerId || !await tx.customer.findFirst({ where: { id: data.customerId, userId, deletedAt: null } })) {
          throw new AppError("Cliente não encontrado.", 404, "CUSTOMER_NOT_FOUND");
        }
      }
      return tx.financeEntry.create({ data: {
        userId, requestId: data.requestId, kind: data.kind, status: data.status,
        customerId: data.kind === "CREDIT" ? data.customerId! : null,
        description: data.description, category: data.category,
        cashCents: cents(data.amount) * (data.kind === "EXPENSE" ? -1 : 1),
        creditCents: data.kind === "CREDIT" ? cents(data.amount) : 0,
        method: data.method, occurredAt: new Date(data.occurredAt),
        dueAt: data.status === "PENDING" ? new Date(data.occurredAt) : null,
      } });
    });
  }

  async settle(userId: string, id: string, occurredAt: string) {
    return financeTransaction(userId, async tx => {
      const entry = await tx.financeEntry.findFirst({ where: { id, userId } });
      if (!entry) throw new AppError("Movimentação não encontrada.", 404, "NOT_FOUND");
      if (entry.status === "POSTED") return entry;
      if (entry.status !== "PENDING") throw new AppError("Movimentação cancelada.", 409, "PAYMENT_CONFLICT");
      return tx.financeEntry.update({ where: { id }, data: { status: "POSTED", occurredAt: new Date(occurredAt) } });
    });
  }

  async reverse(userId: string, id: string, reason: string) {
    return financeTransaction(userId, async tx => {
      const entry = await tx.financeEntry.findFirst({ where: { id, userId }, include: { reversal: true } });
      if (!entry) throw new AppError("Movimentação não encontrada.", 404, "NOT_FOUND");
      if (entry.reversal || entry.status === "CANCELLED") return entry;
      if (entry.kind === "REVERSAL") throw new AppError("Não é possível estornar um estorno.", 409, "PAYMENT_CONFLICT");
      if (entry.status === "PENDING") return tx.financeEntry.update({ where: { id }, data: { status: "CANCELLED", description: `${entry.description} | Cancelado: ${reason}` } });
      if (entry.customerId && await creditBalance(tx, userId, entry.customerId) - entry.creditCents < 0) {
        throw new AppError("Esse crédito já foi usado. Estorne primeiro a utilização do crédito.", 409, "PAYMENT_CONFLICT");
      }
      const reversal = await tx.financeEntry.create({ data: {
        userId, customerId: entry.customerId, appointmentId: entry.appointmentId,
        requestId: `reversal:${id}`, reversalOfId: id, kind: "REVERSAL",
        description: reason, category: entry.category, method: entry.method,
        cashCents: -entry.cashCents, creditCents: -entry.creditCents, appliedCents: -entry.appliedCents, occurredAt: new Date(),
      } });
      if (entry.appointmentId) await syncAppointment(tx, userId, entry.appointmentId);
      return reversal;
    });
  }

  async customer(userId: string, customerId: string) {
    return prisma.$transaction(async tx => {
      if (!await tx.customer.findFirst({ where: { id: customerId, userId, deletedAt: null } })) throw new AppError("Cliente não encontrado.", 404, "CUSTOMER_NOT_FOUND");
      const appointments = await tx.appointment.findMany({ where: { userId, customerId, deletedAt: null }, orderBy: { appointmentDate: "desc" }, include: { items: true } });
      const history = await tx.financeEntry.findMany({ where: { userId, customerId }, orderBy: { createdAt: "desc" }, take: 100, include: {
        appointment: { select: { appointmentDate: true } }, reversal: { select: { id: true } },
      } });
      return { credit: (await creditBalance(tx, userId, customerId)) / 100,
        outstanding: appointments.reduce((sum, a) => sum + cents(a.total) - cents(a.paidAmount), 0) / 100,
        appointments: appointments.filter(a => cents(a.total) > cents(a.paidAmount)).map(a => ({ ...a, total: Number(a.total), paidAmount: Number(a.paidAmount), remaining: (cents(a.total) - cents(a.paidAmount)) / 100 })),
        history,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async list(userId: string, from: Date, to: Date, page: number, kind?: string, method?: z.infer<typeof methodSchema>, status?: string) {
    return prisma.$transaction(async tx => {
      const where: Prisma.FinanceEntryWhereInput = { userId, occurredAt: { gte: from, lt: to }, ...(kind ? { kind } : {}), ...(method ? { method } : {}), ...(status ? { status } : {}) };
      const [data, total, opening, rows, unpaid, due] = await Promise.all([
        tx.financeEntry.findMany({ where, include: {
          customer: { select: { name: true } },
          appointment: { select: { appointmentDate: true } },
          reversal: { select: { id: true } },
        }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 25 }),
        tx.financeEntry.count({ where }),
        tx.financeEntry.aggregate({ where: { userId, status: "POSTED", occurredAt: { lt: from } }, _sum: { cashCents: true } }),
        tx.financeEntry.findMany({ where: { userId, status: "POSTED", occurredAt: { gte: from, lt: to } }, select: { cashCents: true } }),
        tx.appointment.aggregate({ where: { userId, deletedAt: null }, _sum: { total: true, paidAmount: true } }),
        tx.financeEntry.findMany({ where: { userId, status: "PENDING" }, select: { cashCents: true } }),
      ]);
      const incoming = rows.reduce((s, r) => s + Math.max(0, r.cashCents), 0), outgoing = rows.reduce((s, r) => s + Math.max(0, -r.cashCents), 0);
      const initial = opening._sum.cashCents ?? 0;
      return { data, total, summary: { opening: initial / 100, incoming: incoming / 100, outgoing: outgoing / 100, balance: (initial + incoming - outgoing) / 100,
        receivable: (cents(unpaid._sum.total ?? 0) - cents(unpaid._sum.paidAmount ?? 0) + due.reduce((s,r) => s + Math.max(0,r.cashCents),0)) / 100,
        payable: due.reduce((s,r) => s + Math.max(0,-r.cashCents),0) / 100 } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }
}

export const financeService = new FinanceService();
export const settlementSchema = z.object({ occurredAt: pastDate });
