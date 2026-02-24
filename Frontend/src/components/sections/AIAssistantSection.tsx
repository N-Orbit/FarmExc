'use client';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { AIAssistantChat } from './AIAssistantChat';

const capabilities = [
  {
    icon: '🎓',
    title: 'Learn & Grow',
    description: 'Guided lessons from basics to advanced trading',
  },
  {
    icon: '💬',
    title: 'Ask Anything',
    description: '24/7 AI support for all your crypto questions',
  },
  {
    icon: '📊',
    title: 'Market Insights',
    description: 'Real-time analysis and trading strategies',
  },
  {
    icon: '🔗',
    title: 'Stellar Native',
    description: 'Deep integration with Stellar ecosystem',
  },
];

export function AIAssistantSection() {
  return (
    <section className="bg-black py-20 text-white sm:py-24 lg:py-32">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">
            Meet Your AI <span className="text-brand-blue">Crypto Mentor</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white/80 sm:text-xl">
            Stellara AI combines advanced artificial intelligence with deep crypto knowledge
            to guide your learning journey every step of the way.
          </p>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AIAssistantChat />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col justify-center"
          >
            <div className="space-y-8">
              {capabilities.map((capability, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                    {capability.icon}
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-semibold">{capability.title}</h3>
                    <p className="text-white/70">{capability.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
