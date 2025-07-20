import { Inter, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const didot = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-didot',
  display: 'swap',
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});
