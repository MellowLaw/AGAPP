import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LguProvider } from '../contexts/LguContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { DesktopSidebar } from '../components/layout/DesktopSidebar';
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(r) { r.unregister(); });
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-text-primary antialiased selection:bg-amber-200 transition-colors duration-200">
        <LguProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <PwaInstallBanner />
                <ScreenBackground>
                  <div className="flex min-h-screen">
                    <DesktopSidebar className="hidden lg:flex" />
                    <main className="flex-1 min-h-screen w-full relative lg:pl-[72px] pb-24 lg:pb-12">
                      {children}
                    </main>
                  </div>
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
