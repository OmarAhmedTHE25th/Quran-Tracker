export default function Home() {
  return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-4xl font-bold">Hello World! 🚀</h1>
      </div>
  );
}
interface Surah{
    surah_number: number;
    juz: number;
    total_ayat: number;
    completed_ayat: number;
}