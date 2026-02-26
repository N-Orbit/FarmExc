import React from 'react';
import type { Metadata } from 'next';
import { Outfit, Instrument_Serif } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: "Stellara AI",
  description: "Learn. Trade. Connect. Powered by AI on Stellar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
