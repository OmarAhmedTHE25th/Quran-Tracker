-- CreateTable
CREATE TABLE "SurahProgress" (
    "number" INTEGER NOT NULL,
    "englishName" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAyahs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SurahProgress_pkey" PRIMARY KEY ("number")
);
