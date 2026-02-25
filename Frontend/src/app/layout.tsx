import React from 'react';
import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'normal',
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
    <html lang="en">
      <body className={`${instrumentSerif.className} min-h-screen bg-[#f9fafb] text-[#111827]`}>
        {children}
      </body>
    </html>
  );
}
