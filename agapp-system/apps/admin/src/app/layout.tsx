import './globals.css';
import { Plus_Jakarta_Sans, EB_Garamond } from 'next/font/google';

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
        {children}
      </body>
    </html>
  );
}
