/*
  Warnings:

  - The primary key for the `SurahProgress` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "SurahProgress" DROP CONSTRAINT "SurahProgress_pkey",
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "SurahProgress_pkey" PRIMARY KEY ("userId", "number");
