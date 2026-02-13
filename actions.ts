"use server"
import {initializePrisma} from "@/prisma/prisma";
import {revalidatePath} from "next/cache";
const prisma = initializePrisma()
async function findSurah(surahNumber: number) {
    const row = await prisma.surahProgress.findUnique(
        {
            where: {number: surahNumber},
        }
    );
    if (!row) throw new Error("Surah not found in DB")
    return row
}
export async function markSurahDone(surahNumber: number)
{
    const row  = await findSurah(surahNumber)
    await prisma.surahProgress.update(
        {
            where: {number: surahNumber },
            data: {
                completed: true,
                completedAyahs: row.numberOfAyahs
            }
        });
    revalidatePath("/");
}
export async function markSurahUndone(surahNumber:number)
{
    await prisma.surahProgress.update(
        {
            where: {number: surahNumber },
            data: {
                completed: false,
                completedAyahs: 0
            }
        });
    revalidatePath("/");
}
export async function incrementAyahs(surahNumber: number)
{
    const row = await  findSurah(surahNumber)
    if(row.completedAyahs===row.numberOfAyahs)return
    let newCompletedAyahs = row.completedAyahs+=1;
    await prisma.surahProgress.update(
      {
          where: {number: surahNumber
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
    const row = await findSurah(surahNumber);
    if(row.completedAyahs===0)return
    await prisma.surahProgress.update(
        {
            where: {number: surahNumber},
            data: {
                completedAyahs: row.completedAyahs-=1,
                completed: false
            }
        }
    )
    revalidatePath("/");
}