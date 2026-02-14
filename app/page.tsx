import {initializePrisma} from "@/prisma/prisma";
import SurahClient from "./client"
import {auth} from "@clerk/nextjs/server";
import {SignInButton, SignUpButton} from "@clerk/nextjs";

function LandingPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#040d21] relative overflow-hidden flex flex-col items-center justify-center px-4">
            {/* Stars background */}
            <div className="absolute inset-0 z-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {[...Array(50)].map((_, i) => (
                        <circle
                            key={i}
                            cx={`${Math.random() * 100}%`}
                            cy={`${Math.random() * 100}%`}
                            r={Math.random() * 1.5}
                            fill="url(#starGradient)"
                            className="animate-pulse"
                            style={{ animationDelay: `${Math.random() * 5}s`, animationDuration: `${2 + Math.random() * 3}s` }}
                        />
                    ))}
                </svg>
            </div>

            {/* Crescent Moon */}
            <div className="absolute top-12 right-12 md:top-24 md:right-24 z-10 opacity-80">
                <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M85 50C85 69.33 69.33 85 50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C56.6343 15 62.8392 16.8451 68.1466 20.0465C58.8574 21.6033 51.7857 29.6457 51.7857 39.2857C51.7857 49.9609 60.4248 58.6 71.1 58.6C76.2257 58.6 80.9064 56.6083 84.4173 53.3541C84.7981 52.2644 85 51.1507 85 50Z"
                        fill="#fbbf24"
                        className="drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                    />
                </svg>
            </div>

            {/* Lanterns */}
            <div className="absolute left-10 bottom-0 hidden md:block opacity-60">
                <svg width="60" height="150" viewBox="0 0 60 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="30" y1="0" x2="30" y2="40" stroke="#4a5568" strokeWidth="2" />
                    <path d="M15 40H45L55 60V90L30 110L5 90V60L15 40Z" fill="#1a202c" stroke="#fbbf24" strokeWidth="2" />
                    <rect x="22" y="65" width="16" height="25" fill="#fbbf24" className="animate-pulse" />
                </svg>
            </div>
            
            <div className="absolute right-20 bottom-0 hidden lg:block opacity-40">
                <svg width="50" height="120" viewBox="0 0 50 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="25" y1="0" x2="25" y2="30" stroke="#4a5568" strokeWidth="2" />
                    <path d="M12 30H38L46 45V70L25 85L4 70V45L12 30Z" fill="#1a202c" stroke="#fbbf24" strokeWidth="2" />
                    <rect x="18" y="50" width="14" height="20" fill="#fbbf24" className="animate-pulse" />
                </svg>
            </div>

            {/* Main Content */}
            <div className="z-20 text-center max-w-2xl">
                <div className="inline-block mb-4 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest">
                    Ramadan Kareem
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                    Quran <span className="text-amber-400">Tracker</span>
                </h1>
                <p className="text-xl text-blue-200/80 mb-10 leading-relaxed font-light">
                    Embark on a meaningful spiritual journey this Ramadan. 
                    Track your progress, stay focused, and complete the Holy Quran at your own pace.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <SignUpButton mode="modal">
                        <button className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:scale-105 active:scale-95 text-lg">
                            Get Started
                        </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                        <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-2xl transition-all text-lg">
                            Sign In
                        </button>
                    </SignInButton>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-amber-500/5 blur-[120px] pointer-events-none"></div>
        </div>
    );
}

export default async function Home() {
    const prisma = initializePrisma();
    const {userId} = await auth()
    if (!userId) return <LandingPage />
    const surahs = await prisma.surahProgress.findMany({
        where: {userId: userId},
        orderBy: {number: "asc"},
    });

    console.log("surahs count:", surahs.length)
    console.log("userId:", userId)
    if (surahs.length === 0) {
        const res = await fetch("https://api.alquran.cloud/v1/surah");
        const json = await res.json();
        await prisma.surahProgress.createMany({
            data: json.data.map((s: any) => ({
                userId,
                number: s.number,
                englishName: s.englishName,
                completed: false,
                completedAyahs: 0,
                numberOfAyahs: s.numberOfAyahs
            }))
        });
        return <SurahClient surahs={
            await prisma.surahProgress.findMany(
                {where: {userId}, orderBy: {number: "asc"}})
        }/>;

    }
    return <SurahClient surahs={surahs} />
}
