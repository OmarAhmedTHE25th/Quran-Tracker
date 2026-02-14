"use client"
import {startTransition, useMemo, useOptimistic, useState} from "react";
import {markSurahDone, markSurahUndone, incrementAyahs, decrementAyahs, resetAll} from "@/actions";
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

export default function SurahClient({surahs}:{surahs: SurahProgressRow[]}){
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;
    const [optimisticSurahs, updateOptimistic] = useOptimistic<SurahProgressRow[]>(surahs);
    let [openInfo, setOpenInfo] = useState<number | null>(null);
    const totalAyahs = 6236;
    const completedAyahsCount = useMemo(() => {
        return optimisticSurahs.reduce((acc, s) => acc + s.completedAyahs, 0);
    }, [optimisticSurahs]);
    const percentage = Math.round((completedAyahsCount / totalAyahs) * 100);

    const displayedSurahs = useMemo(()=>{
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return optimisticSurahs.slice(startIndex, endIndex);
    }, [optimisticSurahs, page])

    return (
        <div>
            {
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                        updateOptimistic((prev) =>
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
                                        <div
                                            className="flex items-center justify-between text-sm bg-stone-50 p-2 rounded-lg border border-stone-100">
                                            <button
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm"
                                                disabled={s.completedAyahs === 0}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        updateOptimistic(prev => prev.map(s2 => s2.number === s.number
                                                            ? {
                                                                ...s2,
                                                                completedAyahs: s2.completedAyahs - 1,
                                                                completed: false
                                                            }
                                                            : s2
                                                        ));
                                                        await decrementAyahs(s.number);
                                                    });
                                                }}
                                            >
                                                -
                                            </button>
                                            <span className="font-semibold text-stone-700">
                                    {s.completedAyahs} <span
                                                className="text-stone-400 font-normal mx-0.5">/</span> {s.numberOfAyahs}
                                </span>
                                            <button
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 transition-all shadow-sm"
                                                disabled={s.completedAyahs === s.numberOfAyahs}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        updateOptimistic(prev => prev.map(s2 =>
                                                            s2.number === s.number
                                                                ? {
                                                                    ...s2,
                                                                    completedAyahs: s2.completedAyahs + 1,
                                                                    completed: s2.completedAyahs + 1 === s2.numberOfAyahs
                                                                }
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
                                                    updateOptimistic(prev => prev.map(s2 =>
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