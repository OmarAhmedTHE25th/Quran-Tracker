"use client"
import { useState, useEffect, useTransition } from "react";
import { setDailyGoal } from "@/actions.ramadan";
import Link from "next/link";

// Ramadan 2025 starts March 1 (adjust if needed)
const RAMADAN_START = new Date("2026-02-19");
const TOTAL_QURAN_PAGES = 604;

// Khatma table: pages per prayer per khatma count
const KHATMA_TABLE = [
    { khatmas: 1,  label: "ختمة",         pagesPerPrayer: 4,  pagesPerDay: 20  },
    { khatmas: 2,  label: "ختمتين",        pagesPerPrayer: 8,  pagesPerDay: 40  },
    { khatmas: 3,  label: "ثلاث ختمات",    pagesPerPrayer: 12, pagesPerDay: 60  },
    { khatmas: 4,  label: "اربع ختمات",    pagesPerPrayer: 16, pagesPerDay: 80  },
    { khatmas: 5,  label: "خمس ختمات",     pagesPerPrayer: 20, pagesPerDay: 100 },
    { khatmas: 6,  label: "سته ختمات",     pagesPerPrayer: 24, pagesPerDay: 120 },
    { khatmas: 7,  label: "سبعة ختمات",    pagesPerPrayer: 28, pagesPerDay: 140 },
    { khatmas: 8,  label: "ثمانية ختمات",  pagesPerPrayer: 32, pagesPerDay: 160 },
    { khatmas: 9,  label: "تسعة ختمات",    pagesPerPrayer: 36, pagesPerDay: 180 },
];

const PRAYERS = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

type PrayerTimes = {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
};

const PRESET_CITIES = [
    { label: "Cairo", value: "Cairo", country: "EG" },
    { label: "ElMinya", value: "Minya", country: "EG" },
];
function to12Hour(time: string): string {
    const [hourStr, minute] = time.split(":");
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:${minute} ${ampm}`;
}

function getRamadanDay(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(RAMADAN_START);
    start.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 0;
    return Math.min(Math.max(diff + 1, 1), 30);
}

function getTodayTargetPage(dailyGoal: number): number {
    const day = getRamadanDay();
    return Math.min(day * dailyGoal, TOTAL_QURAN_PAGES);
}

export default function RamadanClient({
                                          currentPage,
                                          dailyGoal,
                                      }: {
    currentPage: number;
    dailyGoal: number;
}) {
    const [cities, setCities] = useState(PRESET_CITIES);
    const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
    const [customCity, setCustomCity] = useState("");
    const [showCustom, setShowCustom] = useState(false);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [prayerLoading, setPrayerLoading] = useState(false);
    const [prayerError, setPrayerError] = useState("");
    const [selectedKhatma, setSelectedKhatma] = useState<number>(
        KHATMA_TABLE.find(k => k.pagesPerDay === dailyGoal)?.khatmas ?? 1
    );
    const [isPending, startTransition] = useTransition();
    const [goalSaved, setGoalSaved] = useState(false);

    const ramadanDay = getRamadanDay();
    const todayTarget = getTodayTargetPage(dailyGoal);
    const goalReached = currentPage >= todayTarget;
    const progressPercent = Math.min(Math.round((currentPage / todayTarget) * 100), 100);

    const khatmaData = KHATMA_TABLE.find(k => k.khatmas === selectedKhatma)!;

    async function fetchPrayerTimes(city: string, country: string = "") {
        setPrayerLoading(true);
        setPrayerError("");
        try {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, "0");
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const yyyy = today.getFullYear();
            const address = country ? `${city}, ${country}` : city;
            const res = await fetch(
                `https://api.aladhan.com/v1/timingsByAddress/${dd}-${mm}-${yyyy}?address=${encodeURIComponent(address)}&method=5&tune=4,0,0,0,0,0,0,0,0`            );
            const json = await res.json();
            if (json.code !== 200) throw new Error("City not found");
            setPrayerTimes(json.data.timings);
        } catch (e) {
            setPrayerError("Could not fetch prayer times. Try a different city name.");
        } finally {
            setPrayerLoading(false);
        }
    }    useEffect(() => {
        fetchPrayerTimes(selectedCity.value, selectedCity.country);
    }, [selectedCity]);

    function handleCustomCitySubmit() {
        if (!customCity.trim()) return;
        const newCity = { label: customCity.trim(), value: customCity.trim(), country: "" };
        setCities(prev => {
            if (prev.find(c => c.value.toLowerCase() === newCity.value.toLowerCase())) return prev;
            return [...prev, newCity];
        });
        setSelectedCity(newCity);
        fetchPrayerTimes(newCity.value, "");
        setCustomCity("");
        setShowCustom(false);
    }

    function handleSaveGoal() {
        const goal = KHATMA_TABLE.find(k => k.khatmas === selectedKhatma)!.pagesPerDay;
        startTransition(async () => {
            await setDailyGoal(goal);
            setGoalSaved(true);
            setTimeout(() => setGoalSaved(false), 2500);
        });
    }

    return (
        <div className="min-h-screen bg-[#0b1120] text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
    {/* Header */}
    <div className="bg-linear-to-b from-[#0b1120] to-[#0f1a2e] border-b border-amber-900/30">
    <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
    <Link href="/" className="flex items-center gap-2 text-amber-400/70 hover:text-amber-400 transition-colors text-sm font-sans">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    Back to Tracker
    </Link>
    <div className="text-center">
    <div className="text-amber-400 text-xs font-sans uppercase tracking-[0.3em] mb-1">Day {ramadanDay} of 30</div>
    <h1 className="text-2xl md:text-3xl font-bold text-amber-100">رمضان كريم</h1>
    </div>
    <div className="text-right text-amber-400/50 text-xs font-sans">
        <div>Ramadan</div>
        <div className="text-amber-400 font-bold">1447</div>
        </div>
        </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Daily Goal Progress */}
        <div className={`rounded-2xl p-6 border ${goalReached ? "bg-emerald-950/60 border-emerald-500/40" : "bg-[#141f35] border-amber-800/30"}`}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
    <div>
        <h2 className="text-lg font-bold text-amber-100 mb-1">Today's Reading Goal</h2>
    <p className="text-amber-400/60 text-sm font-sans">
        {dailyGoal} pages/day · {KHATMA_TABLE.find(k => k.pagesPerDay === dailyGoal)?.label ?? "Custom"} this Ramadan
    </p>
    </div>
    <div className="text-right">
    <span className="text-3xl font-bold text-amber-300">{currentPage}</span>
        <span className="text-amber-600 font-sans"> / {todayTarget} pages</span>
    </div>
    </div>

    {/* Progress bar */}
    <div className="w-full bg-amber-950/40 rounded-full h-3 mb-3 overflow-hidden border border-amber-900/30">
    <div
        className={`h-full rounded-full transition-all duration-700 ${goalReached ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-amber-600 to-amber-400"}`}
    style={{ width: `${progressPercent}%` }}
    />
    </div>

    {goalReached ? (
        <div className="flex items-center gap-3 mt-4 p-4 bg-emerald-900/40 rounded-xl border border-emerald-500/30">
        <span className="text-2xl">🌙</span>
    <div>
    <p className="text-emerald-300 font-bold">You completed today's goal!</p>
    <p className="text-emerald-400/70 text-sm font-sans">Come back tomorrow to continue. Ramadan Kareem!</p>
    </div>
    </div>
    ) : (
        <p className="text-amber-500/70 text-sm font-sans">
            {todayTarget - currentPage} pages remaining today · {progressPercent}% done
    </p>
    )}
    </div>

    {/* Khatma Goal Selector */}
    <div className="bg-[#141f35] rounded-2xl border border-amber-800/30 overflow-hidden">
    <div className="p-6 border-b border-amber-900/20">
    <h2 className="text-lg font-bold text-amber-100 mb-1">Set Your Khatma Goal</h2>
    <p className="text-amber-400/60 text-sm font-sans">How many times do you want to complete the Quran this Ramadan?</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
    <table className="w-full text-sm font-sans">
    <thead>
        <tr className="bg-[#0f1728]">
    <th className="px-4 py-3 text-right text-amber-400/80 font-bold border-b border-amber-900/20 text-xs uppercase tracking-wider">الهدف</th>
    {PRAYERS.map(p => (
        <th key={p} className="px-4 py-3 text-center text-amber-400/80 font-bold border-b border-amber-900/20 text-xs">{p}</th>
    ))}
    <th className="px-4 py-3 text-center text-amber-400/80 font-bold border-b border-amber-900/20 text-xs">Pages/Day</th>
        <th className="px-4 py-3 border-b border-amber-900/20"></th>
        </tr>
        </thead>
        <tbody>
        {KHATMA_TABLE.map((row) => (
                <tr
                    key={row.khatmas}
            className={`cursor-pointer transition-colors ${selectedKhatma === row.khatmas ? "bg-amber-900/30" : "hover:bg-amber-900/10"}`}
    onClick={() => setSelectedKhatma(row.khatmas)}
>
    <td className="px-4 py-3 text-right text-amber-100 font-bold" dir="rtl">{row.label}</td>
    {PRAYERS.map((_, i) => (
        <td key={i} className="px-4 py-3 text-center text-amber-300/80">{row.pagesPerPrayer} صفحات</td>
    ))}
    <td className="px-4 py-3 text-center text-amber-400 font-bold">{row.pagesPerDay}</td>
        <td className="px-4 py-3 text-center">
    <div className={`w-4 h-4 rounded-full border-2 mx-auto transition-all ${selectedKhatma === row.khatmas ? "bg-amber-400 border-amber-400" : "border-amber-700"}`} />
    </td>
    </tr>
))}
    </tbody>
    </table>
    </div>

    <div className="p-4 flex items-center justify-between border-t border-amber-900/20">
    <p className="text-amber-400/60 text-sm font-sans">
        Selected: <span className="text-amber-300 font-bold">{khatmaData.label}</span> — {khatmaData.pagesPerPrayer} pages per prayer, {khatmaData.pagesPerDay} pages/day
    </p>
    <button
    onClick={handleSaveGoal}
    disabled={isPending}
    className={`px-5 py-2 rounded-xl text-sm font-bold font-sans transition-all ${goalSaved ? "bg-emerald-600 text-white" : "bg-amber-500 hover:bg-amber-400 text-teal-950"} disabled:opacity-50`}
>
    {goalSaved ? "✓ Saved!" : isPending ? "Saving..." : "Set as My Goal"}
    </button>
    </div>
    </div>

    {/* Prayer Times */}
    <div className="bg-[#141f35] rounded-2xl border border-amber-800/30 overflow-hidden">
    <div className="p-6 border-b border-amber-900/20">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
        <h2 className="text-lg font-bold text-amber-100 mb-1">Prayer Times</h2>
    <p className="text-amber-400/60 text-sm font-sans">Today's prayer schedule</p>
    </div>
    {/* City selector */}
    <div className="flex items-center gap-2 flex-wrap">
        {cities.map(city => (
            <button
                key={city.value}
                onClick={() => { setSelectedCity(city); setShowCustom(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all border ${selectedCity.value === city.value && !showCustom ? "bg-amber-500 text-teal-950 border-amber-500" : "border-amber-700/50 text-amber-400 hover:border-amber-500"}`}
            >
                {city.label}
            </button>
        ))}    <button
        onClick={() => setShowCustom(v => !v)}
    className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all border ${showCustom ? "bg-amber-500 text-teal-950 border-amber-500" : "border-amber-700/50 text-amber-400 hover:border-amber-500"}`}
>
    Custom
    </button>
    </div>
    </div>

    {showCustom && (
        <div className="mt-4 flex gap-2">
        <input
            type="text"
        placeholder="Enter city name (e.g. Alexandria)"
        value={customCity}
        onChange={e => setCustomCity(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleCustomCitySubmit()}
        className="flex-1 bg-[#0b1120] border border-amber-800/40 rounded-lg px-4 py-2 text-amber-100 text-sm font-sans placeholder-amber-700/50 focus:outline-none focus:border-amber-500"
        />
        <button
            onClick={handleCustomCitySubmit}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-teal-950 rounded-lg text-sm font-bold font-sans transition-colors"
            >
            Search
            </button>
            </div>
    )}
    </div>

    {prayerLoading && (
        <div className="p-8 text-center text-amber-400/60 font-sans text-sm">
            Loading prayer times...
        </div>
    )}

    {prayerError && (
        <div className="p-6 text-center text-red-400 font-sans text-sm">{prayerError}</div>
    )}

    {prayerTimes && !prayerLoading && (
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-amber-900/20">
            {PRAYER_KEYS.map((key, i) => (
                    <div key={key} className="p-5 text-center">
                <div className="text-amber-400/60 text-xs font-sans uppercase tracking-widest mb-2">{PRAYERS[i]}</div>
                        <div className="text-2xl font-bold text-amber-100">{to12Hour(prayerTimes[key])}</div>
        {khatmaData && (
            <div className="mt-2 text-xs text-amber-600 font-sans">
                +{khatmaData.pagesPerPrayer} pages
        </div>
        )}
        </div>
    ))}
        </div>
    )}
    </div>

    {/* Ramadan Day Progress Bar */}
    <div className="bg-[#141f35] rounded-2xl border border-amber-800/30 p-6">
    <div className="flex justify-between items-center mb-3">
    <h2 className="text-sm font-bold font-sans text-amber-400/80 uppercase tracking-widest">Ramadan Progress</h2>
    <span className="text-amber-300 font-bold font-sans text-sm">Day {ramadanDay} / 30</span>
    </div>
    <div className="w-full bg-amber-950/40 rounded-full h-2 overflow-hidden border border-amber-900/30">
    <div
        className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-700"
    style={{ width: `${(ramadanDay / 30) * 100}%` }}
    />
    </div>
    <div className="flex justify-between mt-2 text-xs text-amber-700 font-sans">
        <span>1 Ramadan</span>
    <span>Eid Al-Fitr</span>
    </div>
    </div>
    </div>
    </div>
);
}