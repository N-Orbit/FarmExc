'use client';

import React from 'react';
import Navbar from '@/components/Navigation/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { AIFeaturesSection } from '@/components/sections/AIFeaturesSection';
import { FutureSection } from '@/components/sections/FutureSection';
import { InsightsSection } from '@/components/sections/InsightsSection';
import { HandsSection } from '@/components/sections/HandsSection';
import { TradingFeaturesSection } from '@/components/sections/TradingFeaturesSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Navbar />

      <main>
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: AI Features (Central Head) */}
        <AIFeaturesSection />

        {/* Section 3: Future of Learning (Glow Card) */}
        <FutureSection />

        {/* Section 4: Insights (Market Cards) */}
        <InsightsSection />

        {/* Section 5: Hands Divider */}
        <HandsSection />

        {/* Section 6: Trading Features (List + Wave) */}
        <TradingFeaturesSection />
      </main>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/5 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} Stellara AI. All rights reserved on Stellar.</p>
      </footer>
    </div>
  );
}
