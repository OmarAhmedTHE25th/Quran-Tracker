"use client";
// @ts-ignore
import {useEffect, useState} from "react";

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

export default function Home() {

    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 30;
    console.log(surahs.filter(surah => surah.completed))
    useEffect(() => {

        const fetchMyData = async () => {
            const res = await fetch("https://api.alquran.cloud/v1/surah");
            const json = await res.json();


            setSurahs(json.data);
        };


       fetchMyData()

    }, []); // 6. The "Only Once" rule.
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedSurahs = surahs.slice(startIndex, endIndex);
    return(
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-white min-h-screen">
        {

            displayedSurahs.map( s => (
                <div className = "border p-4 rounded-lg shadow-md flex flex-col gap-0.5"   key={s.number}>
                    <span>{s.number}</span>.  <span>{s.englishName}</span>
                    <button className={"mt-2 bg-gray-500  text-center text-green-400 py-2 rounded px-6"}
                            onClick={()=> {
                                setSurahs(
                                    surahs.map(surah => {
                                        if (surah.number === s.number) {
                                            let completedSurah =  {...surah};
                                            completedSurah.completed = true;
                                            completedSurah.completedAyahs = surah.numberOfAyahs;
                                            return completedSurah;
                                        } else {
                                            return surah;
                                        }
                                    }
                                    )
                                )
                            }}>
                        Mark as Done</button>

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