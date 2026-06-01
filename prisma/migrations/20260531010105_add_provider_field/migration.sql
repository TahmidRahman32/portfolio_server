/*
  Warnings:

  - Made the column `phone` on table `personal_infos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `personal_infos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "personal_infos" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';
