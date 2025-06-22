import type { Metadata, Viewport } from 'next';
import '@repo/ui/globals.css';
import { inter } from '@/lib/fonts';
import Providers from '@/app/providers';

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
