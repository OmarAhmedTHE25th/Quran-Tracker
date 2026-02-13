"use client"
import {startTransition, useMemo, useOptimistic, useState} from "react";
import {markSurahDone, markSurahUndone, incrementAyahs, decrementAyahs, resetAll} from "@/actions";

type SurahProgressRow = {
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
    const displayedSurahs = useMemo(()=>{
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return optimisticSurahs.slice(startIndex, endIndex);
    }, [optimisticSurahs, page])

    return (
        <div className="p-6">
            <button
                className="bg-red-600 text-white px-4 py-2 rounded mb-4"
onClick={() => {
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
}}
            >
                Reset All
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 items-start">
            {

                displayedSurahs.map(s => {
                    return (
                        <div className="border p-4 rounded-lg shadow-md flex flex-col gap-0.5" key={s.number}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span>{s.number}</span>. <span>{s.englishName}</span>
                                </div>
                                <span className="text-sm">{s.completed ? "Done" : "Not done"}</span>
                            </div>
                            <button className={"mt-2 bg-gray-500  text-center text-green-400 py-2 rounded px-6"}
                                    onClick={() => {
                                        startTransition(async () => {
                                            updateOptimistic(prev => prev.map(s2 =>
                                                s2.number === s.number
                                                    ? { ...s2, completed: !s2.completed, completedAyahs: s2.completed ? 0 : s2.numberOfAyahs }
                                                    : s2
                                            ));
                                            if (s.completed) await markSurahUndone(s.number);
                                            else await markSurahDone(s.number);
                                        });
                                    }}>
                                {s.completed ? "Undo" : "Mark as Done"}
                            </button>


                    <div className={" items-center justify-between mt-2"}>
                        <button className={"rounded bg-blue-600 w-8"} disabled={s.completedAyahs === 0}
                                onClick={() => {
                                    startTransition(async () => {
                                        updateOptimistic(prev => prev.map(s2 => s2.number === s.number
                                            ? {...s2, completedAyahs: s2.completedAyahs - 1, completed: false}
                                            : s2
                                        ));
                                        await decrementAyahs(s.number);
                                    });
                                }}>
                            -
                        </button>
                        <span> {"Progress: " + s.completedAyahs + "/" + s.numberOfAyahs}</span>
                        <button className={"rounded bg-blue-600 w-8"}
                    disabled={s.completedAyahs === s.numberOfAyahs} onClick={() => {
                                startTransition(async () => {
                                    updateOptimistic(prev => prev.map(s2 =>
                                                s2.number === s.number
                                                    ? { ...s2, completedAyahs: s2.completedAyahs + 1, completed: s2.completedAyahs + 1 === s2.numberOfAyahs }
                                                    : s2
                                            ));
                                    await incrementAyahs(s.number);
                                });
                            }}>
                            +

                        </button>

                    </div>
                                <div className="flex flex-wrap gap-0.5 mt-1">
                                    {Array.from({length: s.numberOfAyahs}).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-3 w-3 rounded-sm ${i < s.completedAyahs ? "bg-green-400" : "bg-gray-300"}`}/>
                                    ))}

                                </div>
                            </div>




                    );
                })
            }
            <div className="flex justify-center gap-4 mt-10 mb-10">
                <button
                    className="px-1 py-2 bg-gray-700 rounded disabled:opacity-30"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>

                <span className="flex items-center text-xl font-bold">Page {page} of {Math.ceil(surahs.length / itemsPerPage)}</span>

                <button
                    className="px-4 py-2 bg-gray-700 rounded disabled:opacity-30"
                    onClick={() => setPage(p => Math.min(Math.ceil(surahs.length / itemsPerPage), p + 1))}
                    disabled={page === Math.ceil(surahs.length / itemsPerPage)}
                >
                    Next
                </button>
            </div>
        </div>
        </div>

    )

}