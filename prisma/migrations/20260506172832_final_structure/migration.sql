/*
  Warnings:

  - You are about to drop the column `retention` on the `customer_loyalty` table. All the data in the column will be lost.
  - Added the required column `userId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `professionals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "appointments_paymentStatus_idx";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "customer_loyalty" DROP COLUMN "retention";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "professionals" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
