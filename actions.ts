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
    revalidatePath("/");
}
export async function resetAll() {
    await prisma.surahProgress.updateMany({
        data: {
            completed: false,
            completedAyahs: 0
        }
    });
    revalidatePath("/");
}