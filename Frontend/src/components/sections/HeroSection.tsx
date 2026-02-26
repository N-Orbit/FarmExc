import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function HeroSection() {
  const BottomFeatures = [
    { icon: "/Aipowered.png", label: "AI-Powered Crypto Education" },
    { icon: "/stellaricon.png", label: "Stellar Blockchain" },
    { icon: "/community.png", label: "Community & Social" },
    { icon: "/tradingicon.png", label: "Trading & Wallet" },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-48 pb-20 bg-black overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl aspect-square bg-[radial-gradient(circle_at_50%_50%,rgba(29,54,255,0.1),transparent_70%)] blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col space-y-10 animate-in fade-in slide-in-from-left duration-1000">
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-white">
              <span className="text-[#3D66FF]">Learn.</span> Trade. Connect.
              <br />
              Powered by AI on <span className="text-[#3D66FF]">Stellar</span>.
            </h1>

            <p className="max-w-2xl text-xl sm:text-2xl text-white/70 leading-relaxed font-light">
              Stellara AI is an all-in-one Web3 academy combining AI-powered
              learning, social crypto insights, and real on-chain trading —
              built on Stellar.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-4">
              <Button
                variant="primary"
                className="rounded-full px-10 py-7 bg-[#1D36FF] hover:bg-blue-700 text-lg font-medium transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-10 py-7 border-white/20 bg-white text-black hover:bg-gray-100 text-lg font-medium transition-all hover:scale-105 active:scale-95"
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-[650px] mx-auto animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="absolute inset-0 rounded-full bg-blue-600/5 blur-[120px]" />
            <div className="relative h-full w-full">
              <Image
                src="/hero-image.jpg"
                alt="Stellara AI Hero"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature List */}
        <div className="mt-24 w-full">
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 py-12 border-t border-white/5">
            {BottomFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-700"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={feature.icon}
                    alt={feature.label}
                    fill
                    className="object-contain invert brightness-200"
                  />
                </div>
                <span className="text-white/80 text-lg font-serif">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
