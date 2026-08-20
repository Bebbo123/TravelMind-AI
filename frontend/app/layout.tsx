import './globals.css';
import type { Metadata, Viewport } from 'next';
import PWARegister from './components/PWARegister';

export const metadata: Metadata = {
  title: 'TravelMind AI - Assistente di Viaggio',
  description: 'Il tuo assistente personale di viaggio per il Giappone e tutto il mondo alimentato da intelligenza artificiale.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TravelMind AI',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
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
    <html lang="it" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <PWARegister />
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
