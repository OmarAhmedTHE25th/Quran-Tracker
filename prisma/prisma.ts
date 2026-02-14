
import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";
declare global {
    var __pgPool: Pool | undefined;
    var __prisma: PrismaClient | undefined;
}
export function initializePrisma() {
    if (global.__prisma) return global.__prisma;
    const rawUrl = process.env.DATABASE_URL ?? "";
    if (!rawUrl) {
        throw new Error("DATABASE_URL is missing");
    }
    const pool = global.__pgPool?? new Pool({
        connectionString: rawUrl,
    });
    if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
    return prisma;
}
