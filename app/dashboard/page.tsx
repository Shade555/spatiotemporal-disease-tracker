import Link from "next/link";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { TelemetryStream } from "@/components/ui/TelemetryStream";

const metrics = [
  { label: "ARTICLES / 24H", value: "128", note: "+18% vs baseline", color: "text-[#22c55e]" },
  { label: "ACTIVE SIGNALS", value: "02", note: "Dengue / Malaria", color: "text-[#f97316]" },
  { label: "SOURCE NODES", value: "47", note: "Mumbai region", color: "text-[#a855f7]" },
];

export default function DashboardPage() {
  return (
    <main className="crt-shell min-h-screen p-3 sm:p-6">
      <MatrixRain />
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#22c55e] pb-4">
          <div>
            <Link className="text-lg text-[#f97316]" href="/">&lt; EXIT TERMINAL</Link>
            <h1 className="mt-3 font-[family-name:var(--font-pixel-display)] text-lg text-[#22c55e] sm:text-2xl">MUMBAI // SURVEILLANCE DECK</h1>
          </div>
          <div className="text-right text-xl text-[#8da395]">SYSTEM: ONLINE<br />08 SEP 2026 // 08:42 IST</div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {metrics.map((metric) => (
            <article className="pixel-window focus-window bg-[#172235] p-5" key={metric.label} tabIndex={0}>
              <p className="font-[family-name:var(--font-pixel-display)] text-[0.55rem] text-[#8da395]">{metric.label}</p>
              <p className={`mt-4 font-[family-name:var(--font-pixel-display)] text-3xl ${metric.color}`}>{metric.value}</p>
              <p className="mt-3 text-xl text-[#d2e7d8]">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="pixel-window bg-[#050807] p-5">
            <div className="mb-6 flex items-center justify-between border-b-2 border-[#22c55e] pb-3">
              <h2 className="font-[family-name:var(--font-pixel-display)] text-[0.65rem] text-[#22c55e]">SIGNAL VOLUME / 07 DAY WINDOW</h2>
              <span className="text-xl text-[#f97316]">● LIVE</span>
            </div>
            <div className="flex h-64 items-end gap-2 border-b-2 border-l-2 border-[#536274] p-4">
              {[38, 52, 45, 63, 70, 58, 90, 76, 100, 82, 116, 128].map((height, index) => (
                <div className="group flex h-full flex-1 items-end" key={`${height}-${index}`}>
                  <div className={`segmented-meter-bar w-full ${index > 9 ? "bg-[#f97316]" : "bg-[#22c55e]"} group-hover:bg-[#a855f7]`} style={{ height: `${height / 1.4}%`, animationDelay: `${index * 70}ms` }} title={`${height} articles`} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-lg text-[#8da395]"><span>02 SEP</span><span>08 SEP</span></div>
          </article>

          <article className="pixel-window bg-[#172235] p-5">
            <h2 className="mb-5 border-b-2 border-[#a855f7] pb-3 font-[family-name:var(--font-pixel-display)] text-[0.65rem] text-[#a855f7]">TELEMETRY OUTPUT</h2>
            <TelemetryStream />
          </article>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2">
          <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
            <h2 className="mb-5 font-[family-name:var(--font-pixel-display)] text-[0.65rem] text-[#f97316]">ALERT QUEUE</h2>
            <div className="space-y-4 text-xl">
              <p className="border-l-4 border-[#f97316] pl-4"><b className="text-[#f97316]">DENGUE</b> {"// article volume spike detected"}</p>
              <p className="border-l-4 border-[#a855f7] pl-4"><b className="text-[#a855f7]">MALARIA</b> {"// stable within baseline"}</p>
            </div>
          </article>
          <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
            <h2 className="mb-5 font-[family-name:var(--font-pixel-display)] text-[0.65rem] text-[#22c55e]">REGION MAP // MUMBAI</h2>
            <div className="flex min-h-28 items-center justify-center border-2 border-dashed border-[#536274] text-center text-xl text-[#8da395]">MAP MODULE STANDBY<br />Awaiting coordinate feed</div>
          </article>
        </section>
      </div>
    </main>
  );
}