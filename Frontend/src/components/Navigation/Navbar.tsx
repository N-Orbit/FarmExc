'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/store/ui-store';

const navItems = [
  { label: 'Academy', href: '#' },
  { label: 'AI Assistant', href: '#' },
  { label: 'Community', href: '#' },
  { label: 'Trade', href: '#' },
  { label: 'News', href: '#' },
];

const Navbar: React.FC = () => {
  const mobileMenuOpen = useUiStore(state => state.mobileMenuOpen);
  const toggleMobileMenu = useUiStore(state => state.toggleMobileMenu);
  const closeMobileMenu = useUiStore(state => state.closeMobileMenu);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [closeMobileMenu]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-5 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-full border border-white/20 bg-[#1D3DFF] px-4 py-3 shadow-[0_14px_40px_rgba(8,14,58,0.35)] backdrop-blur">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/15 to-transparent" />
          <div className="relative flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-base font-bold tracking-tight text-white sm:text-lg"
            >
              Stellara AI
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-white/90 transition hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:block">
              <Button
                variant="wallet"
                size="sm"
                className="rounded-full border border-white/60 px-5 text-sm font-medium"
              >
                Connect Wallet
              </Button>
            </div>

            <button
              type="button"
              onClick={toggleMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`absolute h-0.5 w-5 bg-white transition ${mobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}
              />
              <span
                className={`absolute h-0.5 w-5 bg-white transition ${mobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mt-3 rounded-3xl border border-white/10 bg-[#090B1E]/95 p-6 shadow-xl lg:hidden"
            >
              <nav className="flex flex-col gap-4">
                {navItems.map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="border-b border-white/10 pb-3 text-sm font-medium text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <Button
                variant="wallet"
                className="mt-6 w-full rounded-full border border-white/60 py-2.5"
                onClick={closeMobileMenu}
              >
                Connect Wallet
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
