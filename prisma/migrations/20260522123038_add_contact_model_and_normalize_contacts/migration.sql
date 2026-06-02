/*
  Warnings:

  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('WHATSAPP', 'INSTAGRAM');

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "phone",
ALTER COLUMN "address" DROP NOT NULL;

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_customerId_type_key" ON "contacts"("customerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_type_value_key" ON "contacts"("type", "value");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
