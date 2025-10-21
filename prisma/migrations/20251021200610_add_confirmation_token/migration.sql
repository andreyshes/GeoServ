/*
  Warnings:

  - A unique constraint covering the columns `[confirmationToken]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmationToken_key" ON "Booking"("confirmationToken");
