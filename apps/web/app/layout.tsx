import type { Metadata } from 'next';
import '@repo/ui/globals.css';
import { Montserrat } from 'next/font/google';
import Providers from '@/app/providers';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Continuum - Healthcare Practice Management',
  description: 'Secure, HIPAA-compliant platform for healthcare professionals and their clients',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
