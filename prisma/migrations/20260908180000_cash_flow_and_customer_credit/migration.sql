-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "appointmentId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cashCents" INTEGER NOT NULL DEFAULT 0,
    "creditCents" INTEGER NOT NULL DEFAULT 0,
    "appliedCents" INTEGER NOT NULL DEFAULT 0,
    "method" "PaymentMethod",
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "reversalOfId" TEXT,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_entries_reversalOfId_key" ON "finance_entries"("reversalOfId");

-- CreateIndex
CREATE INDEX "finance_entries_userId_occurredAt_idx" ON "finance_entries"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "finance_entries_customerId_idx" ON "finance_entries"("customerId");

-- CreateIndex
CREATE INDEX "finance_entries_appointmentId_idx" ON "finance_entries"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_entries_userId_requestId_key" ON "finance_entries"("userId", "requestId");

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "finance_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing paid appointments did not store their payment date. Use the appointment date and label that limitation.
UPDATE "appointments" SET "paidAmount" = "total", "paidAt" = "appointmentDate" WHERE "paymentStatus" = 'PAID';
INSERT INTO "finance_entries" ("id", "userId", "customerId", "appointmentId", "kind", "description", "category", "cashCents", "appliedCents", "method", "occurredAt", "requestId")
SELECT md5('legacy-' || "id")::uuid::text, "userId", "customerId", "id", 'PAYMENT', 'Pagamento anterior à implantação (data estimada pelo atendimento)', 'Atendimentos', ROUND("total" * 100)::integer, ROUND("total" * 100)::integer, "paymentMethod", "appointmentDate", 'legacy:' || "id"
FROM "appointments" WHERE "paymentStatus" = 'PAID' AND "deletedAt" IS NULL AND "total" > 0;
