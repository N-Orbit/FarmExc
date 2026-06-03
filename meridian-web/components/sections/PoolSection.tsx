'use client';

import { motion } from 'framer-motion';
import { Award, BarChart3, Zap } from 'lucide-react';

export function PoolSection() {
  const leaderboard = [
    { rank: 1, name: 'Alex Chen', xp: 15420, yield: '$1,250' },
    { rank: 2, name: 'Sarah Williams', xp: 14890, yield: '$1,180' },
    { rank: 3, name: 'Marcus Johnson', xp: 13650, yield: '$1,095' },
    { rank: 4, name: 'Emma Davis', xp: 12340, yield: '$987' },
    { rank: 5, name: 'James Wilson', xp: 11890, yield: '$945' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="pool" className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Pool Pillar</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Participate in yield pools with zero loss. Earn rewards based on your focus activity while keeping your principal safe.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left - Leaderboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <Award size={20} className="text-primary" />
            Weekly Leaderboard
          </h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {leaderboard.map((entry) => (
              <motion.div
                key={entry.rank}
                variants={itemVariants}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  entry.rank === 1
                    ? 'bg-primary/10 border border-primary/20'
                    : 'border border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="font-bold text-primary text-lg w-6"># {entry.rank}</div>
                  <div>
                    <p className="font-semibold text-foreground">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.xp} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{entry.yield}</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <button className="w-full mt-6 px-4 py-3 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
            View Full Leaderboard
          </button>
        </motion.div>

        {/* Right - Pool features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-foreground">No-Loss Yield</h3>

          {[
            {
              icon: Zap,
              title: 'Auto-Compounding',
              description: 'Your earnings automatically reinvest to maximize growth without any action needed.',
            },
            {
              icon: BarChart3,
              title: 'Weekly Distribution',
              description: 'Yield is distributed every week based on your focus activity and pool participation.',
            },
            {
              icon: Award,
              title: 'No Impermanent Loss',
              description: 'Your principal is always safe. You only gain from pool participation, never lose.',
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Pool Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Total Pool Value</p>
              <p className="text-2xl font-bold text-primary">$5.2M</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Weekly APY</p>
              <p className="text-2xl font-bold text-primary">24%</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
