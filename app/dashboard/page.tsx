import Link from "next/link";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  const now = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase().replace(/ /g, " ");

  return (
    <main className="crt-shell min-h-screen p-3 sm:p-6">
      <MatrixRain />
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#22c55e] pb-4">
          <div>
            <Link className="text-lg text-[#f97316]" href="/">&lt; EXIT TERMINAL</Link>
            <h1 className="mt-3 font-[family-name:var(--font-pixel-display)] text-lg text-[#22c55e] sm:text-2xl">MUMBAI // SURVEILLANCE DECK</h1>
          </div>
          <div className="text-right text-xl text-[#8da395]">SYSTEM: ONLINE<br />{now} // IST</div>
        </header>
        <DashboardClient />
      </div>
    </main>
  );
}