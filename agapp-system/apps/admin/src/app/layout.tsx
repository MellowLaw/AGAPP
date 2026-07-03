import { Suspense } from 'react';
import './globals.css';
import { Plus_Jakarta_Sans, EB_Garamond, Sora, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serifFont = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

// Brand wordmark font (AgappLogo) — kept separate from the body font so the
// "Agapp." mark stays visually consistent wherever it's used.
const brandFont = Sora({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-brand',
  display: 'swap',
});

// Data/metadata/clock typography — coordinates, timestamps, logs, counters.
const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'AGAPP - LGU & Super Admin Dashboard',
  description: 'Automated Governance and Public Service Platform - Capstone Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable} ${brandFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-text-muted text-sm">Loading...</div>}>
          <ThemeProvider>{children}</ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
