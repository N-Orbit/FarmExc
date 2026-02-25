'use client';

import React from 'react';
import Navbar from '@/components/Navigation/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { LandingContentSections } from '@/components/sections/LandingContentSections';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar />
      <HeroSection />
      <LandingContentSections />
    </div>
  );
}
