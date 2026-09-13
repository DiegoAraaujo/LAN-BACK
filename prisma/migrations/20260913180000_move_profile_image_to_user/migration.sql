ALTER TABLE "customers" DROP COLUMN IF EXISTS "profileImage";
ALTER TABLE "users" ADD COLUMN "profileImage" TEXT;
