import Link from "next/link";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { RetroEarth } from "@/components/ui/RetroEarth";
import { VirusSprites } from "@/components/ui/VirusSprites";

export default function Home() {
  return (
    <main className="crt-shell boot-sequence flex min-h-screen items-center justify-center p-4 sm:p-8">
      <MatrixRain />
      <div className="landing-atmosphere" />
      <div className="w-full max-w-6xl border-8 border-black bg-[#172235] p-2 shadow-[0_0_0_3px_#536274] sm:p-4">
        <div className="pixel-window grid min-h-[calc(100vh-4rem)] grid-rows-[auto_1fr_auto] bg-[#0f172a]">
          <header className="flex items-center justify-between border-b-3 border-[#22c55e] bg-[#22c55e] px-3 py-3 text-[#050807]">
            <span className="font-(family-name:--font-pixel-display) text-[0.55rem] sm:text-xs">MUMBAI // SIGNAL WATCH</span>
            <span className="font-(family-name:--font-pixel-display) text-[0.5rem]">[■] [□] [×]</span>
          </header>

          <section className="grid items-start gap-10 p-6 pt-10 sm:p-12 sm:pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:pt-16">
            <div>
              <p className="mb-6 text-sm uppercase tracking-[0.3em] text-[#f97316]">PUBLIC HEALTH // EARLY WARNING CONSOLE</p>
              <h1 className="glitch-title max-w-3xl font-(family-name:--font-pixel-display) text-3xl leading-normal text-[#22c55e] sm:text-5xl" data-text="Mumbai signal intelligence, online.">
                Mumbai signal intelligence, online.
              </h1>
              <p className="mt-8 max-w-xl text-2xl leading-tight text-[#d2e7d8] sm:text-3xl">
                A live research console for detecting unusual Dengue and Malaria news activity before it becomes a headline in the hospital reports.
              </p>
              <Link className="pixel-button mt-10 min-h-14 bg-[#f97316] px-6 text-[#050807]" href="/dashboard">
                [ ENTER DASHBOARD ]
              </Link>
            </div>

            <div className="flex flex-col items-center gap-6 pt-8 lg:pt-16">
              <div className="earth-stage">
                <VirusSprites />
                <RetroEarth />
              </div>
              <div className="pixel-window w-full bg-[#050807] p-4 text-[#22c55e]">
                <div className="mb-5 border-b-2 border-[#a855f7] pb-3 font-(family-name:--font-pixel-display) text-[0.6rem] text-[#a855f7]">BOOT / SYSTEM STATUS</div>
                <div className="space-y-3 text-xl leading-none">
                  <p><span className="text-[#f97316]">&gt;</span> GDELT LINK ........ <b>READY</b></p>
                  <p><span className="text-[#f97316]">&gt;</span> REGION ............ MUMBAI</p>
                  <p><span className="text-[#f97316]">&gt;</span> SIGNALS ........... 02 ACTIVE</p>
                  <p><span className="text-[#f97316]">&gt;</span> LAST SYNC .......... 08:42 IST</p>
                  <p className="pt-4 text-[#a855f7]">[ waiting for operator input ]<span className="terminal-cursor" aria-hidden="true" /></p>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap justify-between gap-3 border-t-3 border-[#22c55e] px-3 py-3 text-lg text-[#8da395]">
            <span>SYS: ONLINE // MEM: 64KB OK</span>
            <span>v0.1.0 // NEWS SIGNALS ONLY</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
