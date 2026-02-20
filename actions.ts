"use server"
import {initializePrisma} from "@/prisma/prisma";
import {revalidatePath} from "next/cache";
import {auth} from "@clerk/nextjs/server"
const prisma = initializePrisma()
async function getUserId()
{
    const { userId } = await auth()
    if (!userId) throw new Error("Not logged in")
    return userId
}
async function findSurah(surahNumber: number) {
    const userId = await getUserId()
    const row = await prisma.surahProgress.findUnique(
        {
            where: {
                userId_number: {
                    number: surahNumber,
                    userId : userId
                }

            },
        }
    );
    if (!row) throw new Error("Surah not found in DB")
    return row
}
export async function markSurahDone(surahNumber: number)
{
    const userId = await getUserId()
    const row  = await findSurah(surahNumber)
    const addedAyahs = row.numberOfAyahs - row.completedAyahs;
    await prisma.surahProgress.update(
        {
            where: {userId_number: {
                    number: surahNumber,
                    userId : userId
                } },
            data: {
                completed: true,
                completedAyahs: row.numberOfAyahs
            }
        });
    if (addedAyahs > 0) {
        await logActivity(userId, addedAyahs, 0);
        if (surahNumber === 18) await awardBadge(userId, "halfway_there");
    }
    await updateStreak(userId);
    revalidatePath("/");
}
export async function markSurahUndone(surahNumber:number)
{
    const userId = await getUserId()
    await prisma.surahProgress.update(
        {
            where: {userId_number: {
                    number: surahNumber,
                    userId : userId
                } },
            data: {
                completed: false,
                completedAyahs: 0
            }
        });
    revalidatePath("/");
}
export async function incrementAyahs(surahNumber: number)
{
    const userId = await getUserId()
    const row = await  findSurah(surahNumber)
    if(row.completedAyahs===row.numberOfAyahs)return
    let newCompletedAyahs = row.completedAyahs+=1;
    await prisma.surahProgress.update(
        {
            where: {userId_number: {
                    number: surahNumber,
                    userId : userId
                }
            },
            data: {
                completedAyahs: newCompletedAyahs,
                completed: newCompletedAyahs === row.numberOfAyahs
            }
        }
    )
    await logActivity(userId, 1, 0);
    if (surahNumber === 18 && newCompletedAyahs === row.numberOfAyahs) {
        await awardBadge(userId, "halfway_there");
    }
    await updateStreak(userId);
    revalidatePath("/");
}


export async function decrementAyahs(surahNumber: number)
{
    const userId = await getUserId()
    const row = await findSurah(surahNumber);
    if(row.completedAyahs===0)return
    await prisma.surahProgress.update(
        {
            where: {userId_number: {
                    number: surahNumber,
                    userId : userId
                }},
            data: {
                completedAyahs: row.completedAyahs-=1,
                completed: false
            }
        }
    )
    await updateStreak(userId);
    revalidatePath("/");
}
export async function resetAll() {
    const userId = await getUserId()
    await prisma.surahProgress.updateMany({
        where: { userId },
        data: {
            completed: false,
            completedAyahs: 0
        }
    });
    await prisma.userStreak.upsert({
        where: { userId },
        update: {
            streakCount: 0,
            lastDate: null,
            currentPage: 1
        },
        create: {
            userId,
            streakCount: 0,
            lastDate: null,
            currentPage: 1
        }
    });
    revalidatePath("/");
}
async function updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.userStreak.findUnique({
        where: { userId }
    });

    if (!streak) {
        await prisma.userStreak.create({
            data: {
                userId,
                streakCount: 1,
                lastDate: today
            }
        });
        return;
    }

    const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;
    if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
    }

    if (lastDate && lastDate.getTime() === today.getTime()) {
        return;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate && lastDate.getTime() === yesterday.getTime()) {
        const newStreak = streak.streakCount + 1;
        await prisma.userStreak.update({
            where: { userId },
            data: {
                streakCount: newStreak,
                lastDate: today
            }
        });
        if (newStreak >= 7) {
            await awardBadge(userId, "consistency_king");
        }
    } else {
        await prisma.userStreak.update({
            where: { userId },
            data: {
                streakCount: 1,
                lastDate: today
            }
        });
    }
}
export async function setAyahs(surahNumber: number, count: number) {
    const userId = await getUserId()
    const row = await findSurah(surahNumber)
    const clamped = Math.min(Math.max(0, count), row.numberOfAyahs)
    const delta = clamped - row.completedAyahs;
    await prisma.surahProgress.update({
        where: { userId_number: { number: surahNumber, userId } },
        data: {
            completedAyahs: clamped,
            completed: clamped === row.numberOfAyahs
        }
    })
    if (delta > 0) {
        await logActivity(userId, delta, 0);
        if (surahNumber === 18 && clamped === row.numberOfAyahs) {
            await awardBadge(userId, "halfway_there");
        }
    }
    await updateStreak(userId)
    revalidatePath("/")
}

export async function updateQuranPage(page: number) {
    const userId = await getUserId()
    const clamped = Math.min(Math.max(1, page), 604)

    const streak = await prisma.userStreak.findUnique({ where: { userId } });
    const oldPage = streak?.currentPage ?? 1;
    const pageDelta = clamped - oldPage;

    await prisma.userStreak.upsert({
        where: { userId },
        update: {
            currentPage: clamped
        },
        create: {
            userId,
            currentPage: clamped,
            streakCount: 0,
            lastDate: null
        }
    })
    if (pageDelta > 0) {
        await logActivity(userId, 0, pageDelta);
    }
    revalidatePath("/")
}

/**
 * Distributes a total ayah count across surahs in order (1, 2, 3…),
 * filling each surah completely before moving to the next.
 * Uses Promise.all instead of a transaction to avoid the 5s timeout
 * when updating all 114 surahs at once.
 */
export async function setTotalCompletedAyahs(total: number) {
    const userId = await getUserId()
    const surahs = await prisma.surahProgress.findMany({
        where: { userId },
        orderBy: { number: 'asc' }
    })

    // Compute per-surah values in JS first (no extra DB round-trips)
    let remaining = Math.max(0, total)
    const updates = surahs.map(surah => {
        const completed = Math.min(remaining, surah.numberOfAyahs)
        remaining = Math.max(0, remaining - completed)
        return { number: surah.number, completed, isDone: completed === surah.numberOfAyahs }
    })

    await Promise.all(
        updates.map(u =>
            prisma.surahProgress.update({
                where: { userId_number: { userId, number: u.number } },
                data: { completedAyahs: u.completed, completed: u.isDone }
            })
        )
    )

    await updateStreak(userId)
    revalidatePath("/")
}
async function logActivity(userId: string, ayahsDelta: number, pagesDelta: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.userReadingLog.upsert({
        where: { userId_date: { userId, date: today } },
        update: {
            ayahsRead: { increment: ayahsDelta },
            pagesRead: { increment: pagesDelta }
        },
        create: {
            userId,
            date: today,
            ayahsRead: ayahsDelta,
            pagesRead: pagesDelta
        }
    });

    if (log.ayahsRead >= 50) {
        await awardBadge(userId, "the_sprinter");
    }
}

async function awardBadge(userId: string, badgeKey: string) {
    try {
        await prisma.userBadge.create({
            data: { userId, badgeKey }
        });
    } catch (e) {
        // Ignore duplicate key errors
    }
}

export async function getWeeklyAnalytics() {
    const userId = await getUserId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await prisma.userReadingLog.findMany({
        where: {
            userId,
            date: { gte: sevenDaysAgo }
        },
        orderBy: { date: "asc" }
    });

    // Fill missing days
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const log = logs.find(l => l.date.toISOString().split('T')[0] === d.toISOString().split('T')[0]);
        result.push({
            date: d.toLocaleDateString("en-US", { weekday: "short" }),
            ayahs: log?.ayahsRead ?? 0
        });
    }
    return result;
}

export async function getBadges() {
    const userId = await getUserId();
    return prisma.userBadge.findMany({
        where: { userId },
        orderBy: { awardedAt: "desc" }
    });
}
