import {initializePrisma} from "@/prisma/prisma";
import SurahClient from "./client"

interface Surah{
    number: number
    name: string
    englishName: string
    englishNameTranslation:string
    numberOfAyahs: number
    revelationType: string
    completedAyahs?: number;
    completed: boolean
}


export async function getSurahData() {
    const res = await fetch("https://api.alquran.cloud/v1/surah");
    const json = await res.json();
    return json.data;
}

    export default async function Home() {
        const prisma = initializePrisma();
        const surahs = await prisma.surahProgress.findMany({
            orderBy: { number: "asc" },
        });

        return <SurahClient surahs={surahs} />;

    }
