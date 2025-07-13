import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        didot: ['var(--font-didot)', 'serif'],
        serif: ['var(--font-didot)', 'serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
