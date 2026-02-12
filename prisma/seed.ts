import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const rawUrl = process.env.DATABASE_URL ?? "";
let hostHint = "missing";
let protocolHint = "missing";

try {
  const u = new URL(rawUrl);
  hostHint = u.host;        // e.g. ep-....neon.tech
  protocolHint = u.protocol; // e.g. postgresql:
} catch {
  hostHint = rawUrl.slice(0, 30) || "empty";
}

console.log("DB URL protocol:", protocolHint);
console.log("DB URL host:", hostHint);
console.log("DB URL first char code:", (process.env.DATABASE_URL ?? "").charCodeAt(0));
console.log("DB URL startsWith postgresql://", (process.env.DATABASE_URL ?? "").startsWith("postgresql://"));
const pool = new Pool({
  connectionString: rawUrl,
});


const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Avoid printing secrets; just confirm it's present
console.log("DB URL present:", Boolean(process.env.DATABASE_URL));

type ApiSurah = {
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
      completed: false,
      completedAyahs: 0,
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
