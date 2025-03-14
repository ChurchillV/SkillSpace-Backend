/*
  Warnings:

  - The primary key for the `Attendee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId]` on the table `Attendee` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Attendee` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Attendee" DROP CONSTRAINT "Attendee_userId_fkey";

-- AlterTable
ALTER TABLE "Attendee" DROP CONSTRAINT "Attendee_pkey",
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ADD CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_userId_key" ON "Attendee"("userId");

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
