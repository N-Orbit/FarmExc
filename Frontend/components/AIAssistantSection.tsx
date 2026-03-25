import Image from "next/image";

type InfoBlockProps = {
  title: string;
  description: string;
};

function InfoBlock({ title, description }: InfoBlockProps) {
  return (
    <div className="max-w-sm">
      <h3 className="text-pretty text-lg leading-7 tracking-tight text-white/90">
        {title}
      </h3>
      <p className="mt-3 text-pretty text-sm leading-6 text-white/65">
        {description}
      </p>
    </div>
  );
}

export default function AIAssistantSection() {
  return (
    <section className="w-full bg-black">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
          <div className="space-y-20">
            <InfoBlock
              title="Learn crypto the smart way"
              description="Guided lessons, quizzes, and real explanations powered by AI — from beginner basics to advanced trading concepts."
            />
            <InfoBlock
              title="A social crypto community"
              description="Share ideas, discuss trends, and connect with traders, builders, and educators in real time."
            />
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/ai-assistant/assistant-section.png"
                alt="Stellara AI assistant"
                fill
                priority
                className="object-cover object-center"
                sizes="(min-width: 1024px) 420px, 80vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35" />
            </div>
          </div>

          <div className="space-y-20">
            <InfoBlock
              title="Chat or speak with Stellara AI"
              description="Understand markets, strategies, and Stellar tools — available 24/7 to guide your learning journey."
            />
            <InfoBlock
              title="Connect your wallet"
              description="Explore Stellar assets, track your portfolio, and move from learning to real on-chain trading seamlessly."
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
        <div className="h-px w-full bg-white/10" />
      </div>
    </section>
  );
}

