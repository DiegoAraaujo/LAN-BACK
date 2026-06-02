/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,value]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `contacts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "contacts_type_value_key";

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "contacts_userId_type_value_key" ON "contacts"("userId", "type", "value");
