import { Suspense } from 'react';
import './globals.css';
import { Inter, Lora } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';

const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serifFont = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['italic', 'normal'],
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
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="min-h-screen">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-text-muted text-sm">Loading...</div>}>
          <ThemeProvider>{children}</ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
