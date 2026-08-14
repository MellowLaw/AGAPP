import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LguProvider } from '../contexts/LguContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeSync } from '../components/ThemeSync';
import { ScreenBackground } from '../components/ScreenBackground';
import { BottomNav } from '../components/layout/BottomNav';
import { PwaInstallBanner } from '../components/pwa/PwaInstallBanner';

export const metadata: Metadata = {
  title: 'AGAPP — Citizen Web Portal',
  description: 'Automated Governance and Public Service Platform for Philippine Local Government Units',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AGAPP Citizen',
  },
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFCF5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-text-primary antialiased selection:bg-amber-200 transition-colors duration-200">
        <LguProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <ThemeSync />
                <PwaInstallBanner />
                <ScreenBackground>
                  <main className="flex-1 min-h-screen max-w-xl mx-auto w-full relative">
                    {children}
                  </main>
                  <BottomNav />
                </ScreenBackground>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </LguProvider>
      </body>
    </html>
  );
}
