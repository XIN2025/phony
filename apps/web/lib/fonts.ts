import { Inter, Playfair_Display } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const didot = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-didot',
  display: 'swap',
});
