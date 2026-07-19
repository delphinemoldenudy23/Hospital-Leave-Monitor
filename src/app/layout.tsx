import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import RouteProgressBar from '@/components/RouteProgressBar';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hospital Leave Management System',
  description: 'Monitor and manage staff leave periods with our enterprise-grade leave management system. Supports web, desktop, and mobile.',
  manifest: '/manifest.json',
  applicationName: 'Hospital Leave Monitor',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Leave Monitor',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Hospital Leave Monitor',
    title: 'Hospital Leave Management System',
    description: 'Monitor and manage staff leave periods',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedSettings = localStorage.getItem('adminSettings');
                  if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    const theme = settings.theme;
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else if (theme === 'light') {
                      document.documentElement.classList.remove('dark');
                    } else {
                      // System theme
                      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }
                  }
                } catch (e) {
                  console.error('Failed to apply theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <RouteProgressBar />
        {children}
        <Toaster position="top-right" toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '16px',
          },
        }} />
      </body>
    </html>
  );
}