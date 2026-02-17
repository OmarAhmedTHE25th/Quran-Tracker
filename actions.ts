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
            lastDate: null
        },
        create: {
            userId,
            streakCount: 0,
            lastDate: null
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
        await prisma.userStreak.update({
            where: { userId },
            data: {
                streakCount: streak.streakCount + 1,
                lastDate: today
            }
        });
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
    await prisma.surahProgress.update({
        where: { userId_number: { number: surahNumber, userId } },
        data: {
            completedAyahs: clamped,
            completed: clamped === row.numberOfAyahs
        }
    })
    await updateStreak(userId)
    revalidatePath("/")
}

export async function updateQuranPage(page: number) {
    const userId = await getUserId()
    const clamped = Math.min(Math.max(1, page), 604)
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
    revalidatePath("/")
}