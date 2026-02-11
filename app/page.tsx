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
    completed_ayat?: number;
}

export default function Home() {
    // 1. Memory: Create a "State" variable to hold the list.
    // It starts as an empty array [].
    const [surahs, setSurahs] = useState<Surah[]>([]);

    // 2. The Trigger: "When this component starts..."
    useEffect(() => {

        // 3. The Worker: We define a function to go get the data.
        const fetchMyData = async () => {
            const res = await fetch("https://api.alquran.cloud/v1/surah");
            const json = await res.json();

            // 4. The Update: We take the array from 'json.data'
            // and put it into our 'surahs' memory.
            setSurahs(json.data);
        };

        // 5. Run the worker!
       console.log( fetchMyData())

    }, []); // 6. The "Only Once" rule.


}