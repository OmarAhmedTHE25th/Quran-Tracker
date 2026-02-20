"use server"
import {initializePrisma} from "@/prisma/prisma";
import {revalidatePath} from "next/cache";
import {auth} from "@clerk/nextjs/server"

const prisma = initializePrisma()

async function getUserId() {
    const { userId } = await auth()
    if (!userId) throw new Error("Not logged in")
    return userId
}

export async function setDailyGoal(pagesPerDay: number) {
    const userId = await getUserId()
    const clamped = Math.min(Math.max(20, pagesPerDay), 180) // 1–9 khatmas
    await prisma.userStreak.upsert({
        where: { userId },
        update: { dailyGoal: clamped },
        create: {
            userId,
            dailyGoal: clamped,
            streakCount: 0,
            lastDate: null,
            currentPage: 1
        }
    })
    revalidatePath("/ramadan")
}

export async function setKhatamTarget(targetDateISO: string | null) {
    const userId = await getUserId()
    let targetDate: Date | null = null
    if (targetDateISO) {
        const d = new Date(targetDateISO)
        if (!isNaN(d.getTime())) targetDate = d
    }
    await prisma.userStreak.upsert({
        where: { userId },
        update: { targetDate: targetDate ?? null },
        create: {
            userId,
            targetDate: targetDate ?? null,
            streakCount: 0,
            lastDate: null,
            currentPage: 1,
            dailyGoal: 20
        }
    })
    revalidatePath("/ramadan")
}