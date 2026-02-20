import { initializePrisma } from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RamadanClient from "./client";

export default async function RamadanPage() {
    const prisma = initializePrisma();
    const { userId } = await auth();
    if (!userId) redirect("/");

    const streak = await prisma.userStreak.findUnique({ where: { userId } });
    const currentPage = streak?.currentPage ?? 1;
    const dailyGoal = streak?.dailyGoal ?? 20;
    const targetDate = streak?.targetDate ?? null;

    return <RamadanClient currentPage={currentPage} dailyGoal={dailyGoal} targetDate={targetDate ? new Date(targetDate) : null} />;
}