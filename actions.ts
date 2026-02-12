"use server"
import {initializePrisma} from "@/prisma/prisma";
import {revalidatePath} from "next/cache";
const prisma = initializePrisma()
export async function markSurahDone(surahNumber: number)
{
    const row  = await prisma.surahProgress.findUnique(
        {
            where: {number :surahNumber},
            select: {numberOfAyahs: true},
        }
    );
    if(!row)throw new Error("Surah not found in DB")
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