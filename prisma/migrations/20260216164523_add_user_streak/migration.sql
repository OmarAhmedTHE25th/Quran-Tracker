-- CreateTable
CREATE TABLE "UserStreak" (
    "userId" TEXT NOT NULL,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastDate" TIMESTAMP(3),

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("userId")
);
