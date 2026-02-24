'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';

const features = [
  {
    title: 'Learn Crypto the Smart Way',
    description: 'Guided lessons, quizzes, and real explanations powered by AI — from beginner basics to advanced trading concepts.',
  },
  {
    title: 'Join the Community',
    description: 'Share ideas, discuss trends, and connect with traders, builders, and educators in real time.',
  },
  {
    title: '24/7 AI Assistant',
    description: 'Chat or speak with Stellara AI to understand markets, strategies, and Stellar tools anytime.',
  },
  {
    title: 'Seamless Trading',
    description: 'Connect your wallet, explore Stellar assets, track your portfolio, and trade on-chain effortlessly.',
  },
];

export function AiAssistant() {
  return (
    <section className="bg-black py-20 text-white sm:py-24 lg:py-32">
      <Container>
        <div className="mx-auto grid max-w-[1140px] gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-between gap-10 py-7"
          >
            {features.slice(0, 2).map((feature, idx) => (
              <div key={idx}>
                <p className="text-[1.5rem] leading-tight">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center py-6"
          >
            <Image
              src="/ai.svg"
              alt="Stellara AI Assistant"
              width={466}
              height={508}
              className="h-auto w-full max-w-[466px] object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col justify-between gap-10 py-7"
          >
            {features.slice(2, 4).map((feature, idx) => (
              <div key={idx}>
                <p className="text-[1.5rem] leading-tight">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
