"use client"
import {useCallback, useMemo, useOptimistic, useRef, useState, useTransition, useEffect} from "react";
import {markSurahDone, markSurahUndone, incrementAyahs, decrementAyahs, resetAll, setAyahs, updateQuranPage} from "@/actions";
import {juzAyahCount} from "@/juzAyahCount";
import { surahDescriptions } from "@/surahDescriptions"
type SurahProgressRow = {
    userId: string;
    name: string;
    number: number;
    englishName: string;
    completed: boolean;
    completedAyahs: number;
    numberOfAyahs: number;
};

type UserStreak = {
    userId: string;
    streakCount: number;
    lastDate: Date | null;
    currentPage: number;
};

export default function SurahClient({surahs, streak}:{surahs: SurahProgressRow[], streak: UserStreak | null}){
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;
    const [optimisticSurahs, updateOptimisticSurahs] = useOptimistic<SurahProgressRow[]>(surahs);
    const [optimisticStreak, updateOptimisticStreak] = useOptimistic<number>(streak?.streakCount ?? 0);
    const [optimisticQuranPage, updateOptimisticQuranPage] = useOptimistic<number>(streak?.currentPage ?? 1);
    const [editingAyahs, setEditingAyahs] = useState<Record<number, string>>({});
    const [pageInfo, setPageInfo] = useState<{surah: string, juz: number} | null>(null);
    const streakBumpedToday = useRef(false);

    function handleStreakOptimistic() {
        const lastDate = streak?.lastDate ? new Date(streak.lastDate) : null;
        const today = new Date();
        const alreadyBumpedOnServer = lastDate?.toDateString() === today.toDateString();

        if (!alreadyBumpedOnServer && !streakBumpedToday.current) {
            streakBumpedToday.current = true;
            updateOptimisticStreak(prev => prev + 1);
        }
    }
    let [openInfo, setOpenInfo] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    const fetchPageInfo = useCallback(async (pageNum: number) => {
        try {
            const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`);
            const json = await res.json();
            if (json.data && json.data.ayahs.length > 0) {
                const firstAyah = json.data.ayahs[0];
                setPageInfo({
                    surah: firstAyah.surah.englishName,
                    juz: firstAyah.juz
                });
            }
        } catch (error) {
            console.error("Failed to fetch page info", error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPageInfo(optimisticQuranPage);
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchPageInfo, optimisticQuranPage]);

    const handlePageChange = async (newPage: number) => {
        const clamped = Math.min(Math.max(1, newPage), 604);
        startTransition(async () => {
            updateOptimisticQuranPage(clamped);
            await updateQuranPage(clamped);
        });
    }

    const totalAyahs = 6236;
    const totalPages = 604;
    const pagePercentage = Math.round((optimisticQuranPage / totalPages) * 100);
    const completedAyahsCount = useMemo(() => {
        return optimisticSurahs.reduce((acc, s) => acc + s.completedAyahs, 0);
    }, [optimisticSurahs]);
    const currentJuz = Object.entries(juzAyahCount).find(
        ([_, cumulative]) => completedAyahsCount <= cumulative
    )?.[0]
    const percentage = Math.round((completedAyahsCount / totalAyahs) * 100);
    const completedSurahsCount = useMemo(() =>
            optimisticSurahs.filter(s => s.completed).length
        , [optimisticSurahs]);
    const displayedSurahs = useMemo(()=>{
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return optimisticSurahs.slice(startIndex, endIndex);
    }, [optimisticSurahs, page])

    return (
        <div>
            {
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Streak and Current Juz Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-md flex items-center gap-4 transition-transform hover:scale-[1.02]">
                            <div className="text-4xl drop-shadow-sm">🔥</div>
                            <div>
                                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider">Daily Streak</div>
                                <div className="text-3xl font-black">{optimisticStreak || 0} Days</div>
                            </div>
                        </div>
                        <div className="bg-linear-to-br from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-md flex items-center gap-4 transition-transform hover:scale-[1.02]">
                            <div className="text-4xl drop-shadow-sm">📖</div>
                            <div>
                                <div className="text-teal-100 text-xs font-bold uppercase tracking-wider">Active Juz</div>
                                <div className="text-3xl font-black">Juz {currentJuz}</div>
                            </div>
                        </div>
                        <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex items-center gap-4 transition-transform hover:scale-[1.02]">
                            <div className="text-4xl drop-shadow-sm">📚</div>
                            <div>
                                <div className="text-teal-100 text-xs font-bold uppercase tracking-wider">Completed</div>
                                <div className="text-3xl font-black">{completedSurahsCount} / 114 Surahs</div>
                            </div>
                        </div>
                    </div>

                    {/* Quran Page Tracker Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-semibold text-teal-900">Quran Page Tracker</h2>
                                    <div className="flex items-center bg-teal-100 rounded-full px-3 py-1 border border-teal-200">
                                        <span className="text-teal-700 text-xs font-bold uppercase tracking-wider mr-2">Page</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="604"
                                            value={optimisticQuranPage}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) {
                                                    startTransition(() => {
                                                        updateOptimisticQuranPage(val);
                                                    });
                                                }
                                            }}                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 1 && val <= 604) {
                                                    handlePageChange(val);
                                                }
                                            }}
                                            className="bg-transparent text-teal-900 font-black text-sm w-12 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-stone-500 text-sm mb-6">
                                    {pageInfo ? (
                                        <>Currently in <span className="font-semibold text-teal-700">Surah {pageInfo.surah}</span>, <span className="font-semibold text-teal-700">Juz {pageInfo.juz}</span></>
                                    ) : (
                                        "Loading page details..."
                                    )}
                                </p>
                                
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="604"
                                        value={optimisticQuranPage}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) {
                                                startTransition(() => {
                                                    updateOptimisticQuranPage(val);
                                                });
                                            }
                                        }}
                                        onMouseUp={(e) => {
                                            handlePageChange(parseInt((e.target as HTMLInputElement).value));
                                        }}
                                        onTouchEnd={(e) => {
                                            handlePageChange(parseInt((e.target as HTMLInputElement).value));
                                        }}
                                        className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-teal-600 border border-stone-200"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        <span>Page 1</span>
                                        <span>604 Pages</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center p-4 bg-teal-50 rounded-2xl border border-teal-100 min-w-[140px]">
                                <div className="relative w-24 h-24 mb-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-teal-100"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * pagePercentage) / 100}
                                            className="text-teal-600 transition-all duration-500 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black text-teal-900">{pagePercentage}%</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-teal-900">Your Reading Journey</h2>
                                <p className="text-stone-500 text-sm">Track your progress through the Holy Quran</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-teal-700">{completedAyahsCount}</span>
                                <span className="text-stone-400 font-medium"> / {totalAyahs} Ayahs</span>
                                <div className="text-sm font-semibold text-teal-600">{percentage}% Completed</div>
                            </div>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-4 overflow-hidden border border-stone-200">
                            <div
                                className="bg-linear-to-r from-teal-600 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
                                style={{width: `${percentage}%`}}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mb-6">
                        <button
                            className="text-red-600 hover:text-white border border-red-200 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                            onClick={() => {
                                if (confirm("Are you sure you want to reset all progress?")) {
                                    startTransition(async () => {
                                        handleStreakOptimistic();
                                        updateOptimisticSurahs((prev) =>
                                            prev.map((s2) => ({
                                                ...s2,
                                                completed: false,
                                                completedAyahs: 0,
                                            }))
                                        );
                                        await resetAll();
                                    });
                                }
                            }}
                        >
                            Reset All Progress
                        </button>
                    </div>
                    {
                        openInfo !== null && (
                            <div
                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                onClick={() => setOpenInfo(null)}
                            >
                                <div
                                    className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-teal-900">
                                            {displayedSurahs.find(s => s.number === openInfo)?.englishName}
                                        </h3>
                                        <button onClick={() => setOpenInfo(null)} className="text-stone-400 hover:text-stone-600">✕</button>
                                    </div>
                                    <p className="text-stone-600 leading-relaxed">
                                        {surahDescriptions[openInfo!].desc}
                                        <br />
                                        Read more:{" "}
                                        <a
                                            href={surahDescriptions[openInfo!].ref}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-teal-700 underline hover:text-teal-900"
                                        >
                                            {surahDescriptions[openInfo!].ref}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                        {
                            displayedSurahs.map(s => {
                                return (
                                    <div
                                        className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden"
                                        key={s.number}>
                                        {s.completed && (
                                            <div
                                                className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                                Completed
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                    <span
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold text-sm border border-teal-100">
                                        {s.number}
                                    </span>
                                                <h3 className="font-bold text-stone-800 text-lg leading-tight">{s.englishName + " / " + s.name}</h3>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenInfo(s.number)}
                                            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                                            aria-label={`More info about ${s.englishName}`}
                                        >
                                            Info
                                        </button>
                                        <div className="flex items-center justify-between text-sm bg-stone-50 p-2 rounded-lg border border-stone-100">
                                            <button
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm"
                                                disabled={s.completedAyahs === 0}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        handleStreakOptimistic();
                                                        updateOptimisticSurahs(prev => prev.map(s2 => s2.number === s.number
                                                            ? { ...s2, completedAyahs: s2.completedAyahs - 1, completed: false }
                                                            : s2
                                                        ));
                                                        await decrementAyahs(s.number);
                                                    });
                                                }}
                                            >
                                                -
                                            </button>

                                            <div className="flex items-center gap-1 font-semibold text-stone-700">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={s.numberOfAyahs}
                                                    value={editingAyahs[s.number] ?? s.completedAyahs}
                                                    onChange={e => setEditingAyahs(prev => ({ ...prev, [s.number]: e.target.value }))}
                                                    onBlur={e => {
                                                        const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), s.numberOfAyahs);
                                                        setEditingAyahs(prev => {
                                                            const next = { ...prev };
                                                            delete next[s.number];
                                                            return next;
                                                        });
                                                        if (val === s.completedAyahs) return;
                                                        startTransition(async () => {
                                                            handleStreakOptimistic();
                                                            updateOptimisticSurahs(prev => prev.map(s2 => s2.number === s.number
                                                                ? { ...s2, completedAyahs: val, completed: val === s2.numberOfAyahs }
                                                                : s2
                                                            ));
                                                            await setAyahs(s.number, val);
                                                        });
                                                    }}
                                                    onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                                                    className="w-12 text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-400 rounded px-1"
                                                />
                                                <span className="text-stone-400 font-normal mx-0.5">/</span>
                                                <span>{s.numberOfAyahs}</span>
                                            </div>

                                            <button
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm"
                                                disabled={s.completedAyahs === s.numberOfAyahs}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        handleStreakOptimistic();
                                                        updateOptimisticSurahs(prev => prev.map(s2 => s2.number === s.number
                                                            ? { ...s2, completedAyahs: s2.completedAyahs + 1, completed: s2.completedAyahs + 1 === s2.numberOfAyahs }
                                                            : s2
                                                        ));
                                                        await incrementAyahs(s.number);
                                                    });
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {Array.from({length: s.numberOfAyahs}).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 min-w-0.5 rounded-full transition-colors ${i < s.completedAyahs ? "bg-teal-500" : "bg-stone-200"}`}/>
                                            ))}
                                        </div>

                                        <button
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                s.completed
                                                    ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
                                                    : "bg-teal-700 text-white hover:bg-teal-800 shadow-sm"
                                            }`}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    handleStreakOptimistic();
                                                    updateOptimisticSurahs(prev => prev.map(s2 =>
                                                        s2.number === s.number
                                                            ? {
                                                                ...s2,
                                                                completed: !s2.completed,
                                                                completedAyahs: s2.completed ? 0 : s2.numberOfAyahs
                                                            }
                                                            : s2
                                                    ));
                                                    if (s.completed) await markSurahUndone(s.number);
                                                    else await markSurahDone(s.number);
                                                });
                                            }}
                                        >
                                            {s.completed ? "Mark as Incomplete" : "Complete Surah"}
                                        </button>
                                    </div>
                                );
                            })
                        }
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-12 mb-8">
                        <button
                            className="p-3 bg-white border border-stone-200 rounded-xl disabled:opacity-30 hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm"
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                window.scrollTo({top: 0, behavior: 'smooth'});
                            }}
                            disabled={page === 1}
                            aria-label="Previous Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-stone-400 text-sm uppercase tracking-widest font-bold">Page</span>
                            <span className="text-teal-900 text-xl font-black">{page}</span>
                            <span className="text-stone-300 text-xl font-light">/</span>
                            <span
                                className="text-stone-500 text-lg font-medium">{Math.ceil(surahs.length / itemsPerPage)}</span>
                        </div>

                        <button
                            className="p-3 bg-white border border-stone-200 rounded-xl disabled:opacity-30 hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm"
                            onClick={() => {
                                setPage(p => Math.min(Math.ceil(surahs.length / itemsPerPage), p + 1));
                                window.scrollTo({top: 0, behavior: 'smooth'});
                            }}
                            disabled={page === Math.ceil(surahs.length / itemsPerPage)}
                            aria-label="Next Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}