import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { FocusSection } from '@/components/sections/FocusSection';
import { StreamSection } from '@/components/sections/StreamSection';
import { PoolSection } from '@/components/sections/PoolSection';
import { Features } from '@/components/sections/Features';
import { CTA } from '@/components/sections/CTA';

export default function Page() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <FocusSection />
        <StreamSection />
        <PoolSection />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
