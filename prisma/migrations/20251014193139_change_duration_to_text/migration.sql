/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "durationMinutes",
ADD COLUMN     "durationText" TEXT;
