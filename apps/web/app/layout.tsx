import type { Metadata, Viewport } from 'next';
import '@repo/ui/globals.css';
import { inter, didot } from '@/lib/fonts';
import Providers from '@/app/providers';
import { SessionErrorHandler } from '@/components/SessionErrorHandler';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Continuum - Healthcare Practice Management',
  description: 'Secure, HIPAA-compliant platform for healthcare professionals and their clients',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link
          href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
          rel='stylesheet'
        />
        {/* PWA meta tags */}
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#e11d48' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='mobile-web-app-capable' content='yes' />
        <link rel='apple-touch-icon' sizes='192x192' href='/icons/icon-192x192.png' />
        <link rel='apple-touch-icon' sizes='512x512' href='/icons/icon-512x512.png' />
      </head>
      <body
        className={`${inter.variable} ${didot.variable} font-sans antialiased bg-gradient-to-r from-red-30 via-yellow-1 to-blue-50`}
      >
        <ServiceWorkerRegister />
        <Providers>
          <SessionErrorHandler>{children}</SessionErrorHandler>
        </Providers>
      </body>
    </html>
  );
}
