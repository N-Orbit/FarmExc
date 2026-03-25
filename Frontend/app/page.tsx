import Image from "next/image";
import AIAssistantSection from "../components/AIAssistantSection";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-black font-sans text-white">
      <main className="flex flex-1 flex-col">
        <section className="w-full bg-black">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28 lg:px-10">
            <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-medium tracking-wide text-white/60">
                  Stellara AI
                </p>
                <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                  Learn, trade, and grow with an AI-first crypto academy.
                </h1>
                <p className="mt-5 text-pretty text-base leading-7 text-white/70 sm:text-lg">
                  Guided learning, real conversations, and on-chain tools — built
                  on Stellar and powered by Stellara AI.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#ai-assistant"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                  >
                    Explore the assistant
                  </a>
                  <a
                    href="#"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/0 px-6 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5"
                  >
                    Connect wallet
                  </a>
                </div>
              </div>
              <div className="w-full max-w-md">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Image
                    src="/globe.svg"
                    alt=""
                    fill
                    className="object-cover opacity-35"
                    sizes="(min-width: 1024px) 448px, 90vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-black/0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div id="ai-assistant">
          <AIAssistantSection />
        </div>
      </main>
    </div>
  );
}
