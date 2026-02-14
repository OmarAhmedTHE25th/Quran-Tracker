/*
  Warnings:

  - You are about to drop the column `arabicName` on the `SurahProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SurahProgress" DROP COLUMN "arabicName",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
