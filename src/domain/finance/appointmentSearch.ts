import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../shared/database/prisma.js";
import { cents, methodSchema } from "./FinanceService.js";
import { dashboardPeriod } from "../dashboard/dashboardPeriod.js";

export const searchSchema = z.object({
  openOnly: z.enum(["true"]).optional(),
  search: z.string().max(200).optional(), serviceId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(), customerId: z.string().uuid().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL"]).optional(), paymentMethod: methodSchema.optional(),
  dateFrom: z.string().date().optional(), dateTo: z.string().date().optional(), dateType: z.enum(["appointment", "payment"]).default("appointment"),
  year: z.coerce.number().int().min(2000).max(2100).optional(), month: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(10),
}).refine(data => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo, "Período inválido.");
export function dateRange(from?: string, to?: string) {
  // Dates in the business timezone (Brazil has no DST for current operational dates).
  return { ...(from ? { gte: new Date(`${from}T00:00:00-03:00`) } : {}), ...(to ? { lt: new Date(new Date(`${to}T00:00:00-03:00`).getTime() + 86400000) } : {}) };
}
export async function searchAppointments(userId: string, filters: z.infer<typeof searchSchema>) {
  let dates = dateRange(filters.dateFrom, filters.dateTo);
  if (!filters.dateFrom && !filters.dateTo && (filters.year || filters.month)) {
    const p = dashboardPeriod(filters.year ?? new Date().getFullYear(), filters.month);
    dates = { gte: p.start, lt: p.end };
  }
  const paymentWhere: Prisma.FinanceEntryWhereInput = { userId, kind: "PAYMENT", status: "POSTED", reversal: null,
    ...(filters.dateType === "payment" ? { occurredAt: dates } : {}), ...(filters.paymentMethod ? { method: filters.paymentMethod } : {}) };
  const where: Prisma.AppointmentWhereInput = { userId, deletedAt: null,
    ...(filters.search ? { customer: { name: { contains: filters.search, mode: "insensitive" } } } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : filters.openOnly ? { paymentStatus: { not: "PAID" } } : {}),
    ...(filters.dateType === "appointment" ? { appointmentDate: dates } : {}),
    ...(filters.dateType === "payment" || filters.paymentMethod ? { financeEntries: { some: paymentWhere } } : {}),
    ...((filters.serviceId || filters.professionalId) ? { items: { some: { ...(filters.serviceId ? { serviceId: filters.serviceId } : {}), ...(filters.professionalId ? { professionalId: filters.professionalId } : {}) } } } : {}),
  };
  return prisma.$transaction(async tx => {
    const [rows, total, totalPending, sums] = await Promise.all([
      tx.appointment.findMany({ where, include: { items: true, customer: { select: { name: true } } }, orderBy: [{ appointmentDate: "desc" }, { id: "desc" }], take: filters.limit, skip: (filters.page-1)*filters.limit }),
      tx.appointment.count({ where }),
      tx.appointment.count({ where: { AND: [where, { paymentStatus: { not: "PAID" } }] } }),
      tx.appointment.aggregate({ where, _sum: { total: true, paidAmount: true } }),
    ]);
    const summary = { totalValue: cents(sums._sum.total ?? 0), paidValue: cents(sums._sum.paidAmount ?? 0), pendingValue: cents(sums._sum.total ?? 0)-cents(sums._sum.paidAmount ?? 0), serviceValue: 0 };
    const filteredItems = filters.serviceId || filters.professionalId
      ? await tx.appointment.findMany({ where, select: { total: true, items: { select: { value: true, serviceId: true, professionalId: true } } } }) : [];
    if (!filters.serviceId && !filters.professionalId) summary.serviceValue = summary.totalValue;
    for (const a of filteredItems) {
      const weights = a.items.map(i => cents(i.value));
      const sum = weights.reduce((s,n) => s+n,0);
      const allocations = weights.map(w => sum ? Math.floor(cents(a.total) * w / sum) : 0);
      let remainder = cents(a.total) - allocations.reduce((s,n) => s+n,0);
      for (let i = 0; remainder > 0 && allocations.length; i = (i+1)%allocations.length) { allocations[i]!++; remainder--; }
      a.items.forEach((item,i) => { if ((!filters.serviceId || filters.serviceId === item.serviceId) && (!filters.professionalId || filters.professionalId === item.professionalId)) summary.serviceValue += allocations[i] ?? 0; });
    }
    return { data: rows.map(a => ({
      ...a, customerName: a.customer.name, total: Number(a.total), subtotal: Number(a.subtotal), discount: Number(a.discount),
      paidAmount: Number(a.paidAmount), remaining: (cents(a.total)-cents(a.paidAmount))/100,
      items: a.items.map(i => ({ ...i, value: Number(i.value) })),
    })), total, totalPending,
      summary: Object.fromEntries(Object.entries(summary).map(([key,value]) => [key,value/100])) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
