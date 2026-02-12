"use client"
import {startTransition, useMemo, useState, useTransition} from "react";
import { markSurahDone, markSurahUndone } from "../actions";
type SurahProgressRow = {
    number: number;
    englishName: string;
    completed: boolean;
    completedAyahs: number;
    numberOfAyahs: number;
};

export default function SurahClient({surahs}:{surahs: SurahProgressRow[]}){
    const [page, setPage] = useState(1);
    const itemsPerPage = 30;
    const displayedSurahs = useMemo(()=>{
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return surahs.slice(startIndex, endIndex);
    }, [surahs, page])
    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-white min-h-screen">
            {

                displayedSurahs.map(s => (
                    <div className="border p-4 rounded-lg shadow-md flex flex-col gap-0.5" key={s.number}>
                        <div className="flex items-center justify-between">
                            <div>
                                <span>{s.number}</span>. <span>{s.englishName}</span>
                            </div>
                            <span className="text-sm">{s.completed ? "Done" : "Not done"}</span>
                        </div>
                        <button className={"mt-2 bg-gray-500  text-center text-green-400 py-2 rounded px-6"}
                                onClick={()=>{
                                    startTransition(async ()=>{
                                        if (s.completed)await markSurahUndone(s.number)
                                        else await markSurahDone(s.number)
                                    })
                                }}>
                            {s.completed ? "Undo" : "Mark as Done"}
                        </button>

                    </div>

                ))
            }
            <div className="flex justify-center gap-4 mt-10 mb-10">
                <button
                    className="px-1 py-2 bg-gray-700 rounded disabled:opacity-30"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </button>

                <span className="flex items-center text-xl font-bold">Page {page} of 4</span>

                <button
                    className="px-4 py-2 bg-gray-700 rounded disabled:opacity-30"
                    onClick={() => setPage(p => Math.min(4, p + 1))}
                    disabled={page === 4}
                >
                    Next
                </button>
            </div>
        </div>


    )

}