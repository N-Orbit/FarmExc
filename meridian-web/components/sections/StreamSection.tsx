'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wallet, Clock } from 'lucide-react';

export function StreamSection() {
  const streamData = [
    { time: '9:00', amount: 0 },
    { time: '12:00', amount: 125 },
    { time: '15:00', amount: 250 },
    { time: '18:00', amount: 375 },
    { time: '21:00', amount: 500 },
    { time: '24:00', amount: 625 },
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="stream" className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Stream Pillar</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Real-time payment streams connecting employees to employers with transparent, continuous compensation.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Real-Time Payment Stream
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={streamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary)', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4">Your salary flows in real-time throughout the day</p>
        </motion.div>

        {/* Right - Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-foreground">Continuous Compensation</h3>

          {[
            {
              icon: Clock,
              title: 'Real-Time Flow',
              description: 'Receive salary continuously instead of waiting for payday. Every second counts.',
            },
            {
              icon: Wallet,
              title: 'Instant Withdrawals',
              description: 'Access your streamed earnings anytime without waiting periods or fees.',
            },
            {
              icon: TrendingUp,
              title: 'Transparent Rates',
              description: 'Know exactly how much you earn per second with clear, predictable payment streams.',
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

          {/* Calculator */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 mt-8"
          >
            <h4 className="font-semibold text-foreground mb-4">Earnings Calculator</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Monthly Salary</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-primary">$5,000</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Per Second Rate</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">$0.0578</span>
                  <span className="text-sm text-muted-foreground">/second</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
