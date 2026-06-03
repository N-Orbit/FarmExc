'use client';

import { motion } from 'framer-motion';
import { Clock, Zap, Trophy } from 'lucide-react';

export function FocusSection() {
  const petStages = ['Egg', 'Baby', 'Teen', 'Adult', 'Elder'];
  const timerOptions = [10, 25, 45];
  
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="focus" className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Focus Pillar</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Nurture your productivity companion while earning rewards for staying focused.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Pet and progression */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Pet visualization */}
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">🥚 → 🐣 → 🦆 → 🦢 → 👑</div>
            <p className="text-muted-foreground">Your pet evolves as you stay focused</p>
          </motion.div>

          {/* Timer selection */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Choose Your Focus Duration
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {timerOptions.map((minutes) => (
                <button
                  key={minutes}
                  className="py-3 rounded-lg border border-primary bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors"
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </motion.div>

          {/* Streaks and XP */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={18} className="text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
              </div>
              <div className="text-3xl font-bold text-primary">42 Days</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-primary" />
                <span className="text-sm font-medium text-muted-foreground">XP Earned Today</span>
              </div>
              <div className="text-3xl font-bold text-primary">420 XP</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Features and tiers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h3 className="text-2xl font-bold text-foreground mb-6">Supercharge Your Focus</h3>

          {[
            {
              tier: 'Bronze',
              multiplier: '1.0x',
              color: '#CD7F32',
              features: ['Pet evolution', 'Basic streaks', '10 min sessions'],
            },
            {
              tier: 'Silver',
              multiplier: '1.5x',
              color: '#C0C0C0',
              features: ['All Bronze features', '2x XP rewards', '25 min sessions', 'Custom pets'],
            },
            {
              tier: 'Gold',
              multiplier: '2.0x',
              color: '#FFD700',
              features: ['All Silver features', '3x XP rewards', '45 min sessions', 'Exclusive shop access'],
            },
          ].map((tier) => (
            <motion.div
              key={tier.tier}
              variants={itemVariants}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-foreground text-lg">{tier.tier} Tier</h4>
                  <p className="text-sm text-muted-foreground">{tier.multiplier} XP Multiplier</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: tier.color, opacity: 0.2 }}
                />
              </div>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
