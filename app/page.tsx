import Link from "next/link";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { RetroEarth } from "@/components/ui/RetroEarth";
import { VirusSprites } from "@/components/ui/VirusSprites";

export default function Home() {
  return (
    <main className="crt-shell boot-sequence flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-8">
      <MatrixRain />
      <div className="landing-atmosphere" />
      <div className="w-full max-w-6xl border-4 border-black bg-[#172235] p-1 shadow-[0_0_0_2px_#536274] sm:border-6 sm:p-2 md:border-8 md:p-4 md:shadow-[0_0_0_3px_#536274]">
        <div className="pixel-window grid min-h-screen grid-rows-[auto_1fr_auto] gap-2 bg-[#0f172a] sm:gap-3 md:gap-4">
          <header className="flex flex-col gap-2 items-start justify-between border-b-2 border-[#22c55e] bg-[#22c55e] px-2 py-2 text-[#050807] sm:flex-row sm:items-center sm:border-b-3 sm:px-3 sm:py-3">
            <span className="font-(family-name:--font-pixel-display) text-[0.45rem] sm:text-[0.55rem] md:text-xs">MUMBAI // SIGNAL WATCH</span>
            <span className="font-(family-name:--font-pixel-display) text-[0.4rem] sm:text-[0.5rem]">[■] [□] [×]</span>
          </header>

          <section className="grid gap-4 p-3 pt-6 sm:gap-6 sm:p-6 sm:pt-8 md:gap-10 md:p-12 md:pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:pt-16">
            <div className="flex flex-col justify-start">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#f97316] sm:mb-4 sm:text-sm sm:tracking-[0.3em]">PUBLIC HEALTH // EARLY WARNING CONSOLE</p>
              <h1 className="glitch-title font-(family-name:--font-pixel-display) text-lg leading-tight text-[#22c55e] sm:text-2xl sm:leading-normal md:text-4xl md:leading-normal lg:text-5xl" data-text="Mumbai signal intelligence, online.">
                Mumbai signal intelligence, online.
              </h1>
              <p className="mt-4 text-sm leading-snug text-[#d2e7d8] sm:mt-6 sm:text-lg sm:leading-tight md:mt-8 md:text-xl lg:text-2xl">
                A live research console for detecting unusual configured disease signals before they become a headline in hospital reports.
              </p>
              <Link className="pixel-button mt-6 min-h-10 bg-[#f97316] px-4 py-2 text-[#050807] sm:mt-8 sm:min-h-12 sm:px-5 md:mt-10 md:min-h-14 md:px-6" href="/dashboard">
                [ ENTER DASHBOARD ]
              </Link>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4 sm:gap-5 sm:pt-6 md:gap-6 lg:pt-16">
              <div className="earth-stage">
                <VirusSprites />
                <RetroEarth />
              </div>
              <div className="pixel-window w-full bg-[#050807] p-2 text-[#22c55e] sm:p-3 md:p-4">
                <div className="mb-3 border-b-2 border-[#a855f7] pb-2 font-(family-name:--font-pixel-display) text-[0.5rem] text-[#a855f7] sm:mb-4 sm:pb-3 sm:text-[0.6rem]">BOOT / SYSTEM STATUS</div>
                <div className="space-y-1 text-xs leading-none sm:space-y-2 sm:text-sm md:space-y-3 md:text-base lg:text-xl">
                  <p><span className="text-[#f97316]">&gt;</span> GDELT LINK ........ <b>READY</b></p>
                  <p><span className="text-[#f97316]">&gt;</span> REGION ............ MUMBAI</p>
                  <p><span className="text-[#f97316]">&gt;</span> SIGNALS ........... 02 ACTIVE</p>
                  <p><span className="text-[#f97316]">&gt;</span> LAST SYNC .......... 08:42 IST</p>
                  <p className="pt-2 text-[#a855f7] sm:pt-3"><span>[ waiting for operator input ]</span><span className="terminal-cursor" aria-hidden="true" /></p>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-2 justify-between border-t-2 px-2 py-2 text-xs text-[#8da395] sm:flex-row sm:gap-3 sm:border-t-3 sm:px-3 sm:py-3 sm:text-base md:text-lg border-[#22c55e]">
            <span className="truncate">SYS: ONLINE // MEM: 64KB OK</span>
            <span className="truncate">v0.1.0 // NEWS SIGNALS ONLY</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
