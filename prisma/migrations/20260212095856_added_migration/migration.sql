/*
  Warnings:

  - Added the required column `numberOfAyahs` to the `SurahProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SurahProgress" ADD COLUMN     "numberOfAyahs" INTEGER NOT NULL default 0;
