import type { Metadata, Viewport } from 'next';
import '@repo/ui/globals.css';
import { inter } from '@/lib/fonts';
import Providers from '@/app/providers';
import { SessionErrorHandler } from '@/components/SessionErrorHandler';

export const metadata: Metadata = {
  title: 'Continuum - Healthcare Practice Management',
  description: 'Secure, HIPAA-compliant platform for healthcare professionals and their clients',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-gradient-to-r from-red-100 via-yellow-10 to-blue-50`}
      >
        <Providers>
          <SessionErrorHandler>{children}</SessionErrorHandler>
        </Providers>
      </body>
    </html>
  );
}
