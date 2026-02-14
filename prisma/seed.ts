import {initializePrisma} from "@/prisma/prisma";
const prisma = initializePrisma();

type ApiSurah = {
  name: string;
  number: number;
  englishName: string;
  numberOfAyahs: number;
};

async function main() {
  const res = await fetch("https://api.alquran.cloud/v1/surah");
  const json = await res.json();

  const fetchedSurahs: ApiSurah[] = json.data;

  await prisma.surahProgress.createMany({
    data: fetchedSurahs.map((s) => ({
      number: s.number,
      englishName: s.englishName,
      name: s.name,
      completed: false,
      completedAyahs: 0,
      numberOfAyahs: s.numberOfAyahs
    })),
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
