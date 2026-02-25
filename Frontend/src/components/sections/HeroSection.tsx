import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const featurePills = [
  { label: 'AI-Powered Crypto Education', icon: '/Aipowered.png' },
  { label: 'Stellar Blockchain', icon: '/stellaricon.png' },
  { label: 'Community & Social', icon: '/community.png' },
  { label: 'Trading & Wallet', icon: '/tradingicon.png' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:px-10 lg:pt-14">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(29,61,255,0.24),transparent_40%),radial-gradient(circle_at_20%_20%,rgba(78,198,255,0.2),transparent_35%),linear-gradient(180deg,#0B1023_0%,#12193A_58%,#0B1023_100%)]" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.04fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              <span className="text-[#6AA2FF]">Learn.</span> Trade. Connect.
              <br />
              Powered by AI on <span className="text-[#6AA2FF]">Stellar</span>.
            </h1>
            <p className="mt-6 max-w-x  xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Stellara AI is an all-in-one Web3 academy combining conversational
              guidance, social crypto insights, and real on-chain trading in one
              platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                variant="wallet"
                className="rounded-full bg-[#141DC4]! text-black! px-7 py-3 text-sm font-semibold hover:bg-[#2F4FFB]!"
              >
                Get Started
              </Button>
              <Link href="/about">
                <Button
                  variant="wallet"
                  className="rounded-full border border-white/60 px-7 py-3 text-sm font-semibold"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto h-90 w-full max-w-170 overflow-hidden rounded-[30px]  bg-[#0F1430] shadow-[0_30px_90px_rgba(10,14,45,0.55)] sm:h-115 lg:h-140"
          >
            <div className="absolute inset-0 border-0" />
            <Image
              src="/hero-image.jpg"
              alt="Stellara conversational dashboard preview"
              fill
              className="object-cover opacity-90 border-0"
              sizes="(max-width: 1024px) 100vw, 680px"
              priority
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center  sm:gap-4"
        >
          {featurePills.map(item => (
            <div
              key={item.label}
              className="inline-flex items-center m-4 gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-100 backdrop-blur sm:text-sm"
            >
              <Image
                src={item.icon}
                alt={`${item.label} icon`}
                width={18}
                height={18}
                className="h-4.5 w-4.5 object-contain"
              />
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
