import Image from 'next/image';
import { motion } from 'framer-motion';

const conversationBlocks = [
  'Learn crypto the smart way with guided lessons, quizzes, and real explanations powered by AI - from beginner basics to advanced trading concepts.',
  'Chat or speak with Stellara AI to understand markets, strategies, and Stellar tools - available 24/7 to guide your learning journey.',
  'Join a social crypto community to share ideas, discuss trends, and connect with traders, builders, and educators in real time.',
  'Connect your wallet, explore Stellar assets, track your portfolio, and move from learning to real on-chain trading seamlessly.',
];

const insightCards = [
  {
    title: 'AI Market Brief',
    description:
      'Get daily AI-powered summaries of crypto trends, price movements, and key market signals - explained in simple, beginner-friendly language.',
    accent: 'from-[#1c245a] to-[#2b1f61]',
    icon: '/cardonet.jpg',
    glow: 'shadow-[0px_4px_80px_#9E8D6B]',
    image: '/cardone.jpg',
  },
  {
    title: 'Smart Learning Paths',
    description:
      'Master crypto from beginner to pro with AI-guided lessons and instant feedback.',
    accent: 'from-[#dbe8f0] to-[#afc6d8]',
    text: 'text-[#0d0d0d]',
    icon: '/cardtwot.jpg',
    glow: 'shadow-[0px_4px_90px_rgba(133,109,255,0.95)]',
    image: '/cardtwo.jpg',
  },
  {
    title: 'Trade with Confidence',
    description:
      'Turn knowledge into action with secure, seamless Stellar-based trading tools that bridge learning and real-world crypto activity.',
    accent: 'from-[#2f2663] to-[#37206b]',
    icon: '/cardthreet.jpg',
    glow: 'shadow-[0px_4px_80px_#9E8D6B]',
    image: '/cardthree.jpg',
  },
];

const roadmap = [
  'Smart Stellar Training',
  'AI-Powered Market Insights',
  'Seamless Wallet Integration',
  'Portfolio Tracking',
  'Secure and Transparent Smart Stellar Trading',
];

export function LandingContentSections() {
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-120px' },
    transition: { duration: 0.5 },
  } as const;

  return (
    <div className="mx-auto mt-30 flex w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-4 sm:px-6 lg:gap-20 lg:px-10">
      <motion.section
        {...fadeUp}
        className="mx-auto grid w-full max-w-295 items-start gap-8 pt-6 lg:grid-cols-[1fr_420px_1fr]"
      >
        <div className="space-y-16 pt-2">
          <p className="max-w-62.5 text-[22px] leading-[118%] text-white/92">
            {conversationBlocks[0]}
          </p>
          <p className="max-w-62.5 text-[22px] leading-[118%] text-white/92">
            {conversationBlocks[2]}
          </p>
        </div>
        <div className="relative mx-auto h-100 w-full max-w-full overflow-hidden rounded-xs -mt-20">
          <Image
            src="/middleman.jpg"
            alt="AI avatar visual"
            fill
            sizes="420px"
            className="object-cover"
          />
        </div>
        <div className="space-y-16 pt-2 ">
          <p className="max-w-62.5 text-[20px] leading-[118%] text-white/92">
            {conversationBlocks[1]}
          </p>
          <p className="max-w-62.5 text-[20px] leading-[118%] text-white/92">
            {conversationBlocks[3]}
          </p>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        className="relative my-10 z-0 overflow-hidden rounded-[30px] border border-white/10 px-6 py-20 shadow-[0_30px_80px_rgba(4,9,34,0.6)] sm:px-10 sm:py-20 lg:pr-0"
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(120deg,#061024,#0f1a3a_60%,#060916)]" />
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/section-three-bg.jpg')" }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(5,9,24,0.05),rgba(5,9,24,0.45)_75%,rgba(5,9,24,0.82))]" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h2 className="max-w-145 text-4xl leading-[1.05] text-white sm:text-5xl">
              Power the Future of Crypto Learning with Stellara AI
            </h2>
            <p className="mt-5 max-w-155 text-[20px] leading-[120%] text-white/85">
              An intelligent Web3 crypto academy on Stellar, blending AI-driven
              learning, social collaboration, and real on-chain trading for the
              next generation of crypto users.
            </p>
          </div>
          <div className="relative h-80 overflow-hidden rounded-l-2xl border border-white/10 lg:ml-auto lg:-mr-px lg:w-full lg:border-r-0">
            <Image
              src="/orbit.png"
              alt="Orbit security visual"
              fill
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
            />
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp}>
        <h2 className="max-w-170 text-4xl leading-[1.1] text-white sm:text-5xl">
          <span className="text-[#d37bff]">Stay Inspired</span> with our latest
          insights with Stellara Ai.
        </h2>
        <p className="mt-4 max-w-205 text-[22px] leading-[115%] text-white/85">
          Stay ahead with AI-generated market intelligence, educational tips,
          and real-time Stellar ecosystem updates.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {insightCards.map(card => (
            <article
              key={card.title}
              className={`rounded-3xl border-2 border-white/25 bg-linear-to-br ${card.accent} p-5 backdrop-blur-xs ${card.glow} ${card.text ?? 'text-white'}`}
            >
              <div className="mb-12 flex h-10 w-10  items-center justify-center rounded-ful ">
                <Image
                  src={card.icon}
                  alt={`${card.title} icon`}
                  width={100}
                  height={100}
                  className="w-full, rounded-full "
                />
              </div>
              <h3 className="text-[35px] leading-[0.95]">{card.title}</h3>
              <div className="my-4 h-18 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={card.image}
                  alt={`${card.title} visual`}
                  width={480}
                  height={220}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-[22px] leading-[160%]">{card.description}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        className="relative my-12 h-55 overflow-hidden rounded-[30px] border border-white/10 bg-[#4c4c4c] sm:h-65 md:h-75 lg:my-15 lg:h-100"
      >
        <div className="absolute bottom-0 left-10 h-[45%] w-[56%] overflow-hidden sm:left-8 sm:w-[52%] md:w-[50%] lg:left-30 lg:h-[50%] lg:w-[50%]">
          <Image
            src="/layered.png"
            alt="Layered cards visual"
            fill
            sizes="(max-width: 640px) 56vw, (max-width: 1024px) 50vw, 640px"
            className="object-contain object-bottom-left"
          />
        </div>
        <div className="absolute right-0 top-0 h-full w-[58%] sm:w-[52%] md:w-[48%] lg:w-[40%]">
          <Image
            src="/hand.jpg"
            alt="Futuristic hand visual"
            fill
            className="object-cover object-right opacity-80"
          />
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        className="relative my-10 grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 sm:h-80 md:h-60 lg:absolute lg:-left-40 lg:h-80 lg:w-[54%] lg:border-0">
          <Image
            src="/walllet.jpg"
            alt="Crypto asset visual"
            fill
            sizes="(max-width: 1024px) 100vw, 520px"
            className="object-cover"
          />
        </div>
        <ol className="space-y-4 lg:col-start-2">
          {roadmap.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/3 p-4"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm text-white/90">
                {index + 1}
              </span>
              <p className="text-[21px] leading-[110%] text-white/90">{item}</p>
            </li>
          ))}
        </ol>
      </motion.section>
    </div>
  );
}
