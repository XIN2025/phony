import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-plus-jakarta-sans)',
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        didot: ['var(--font-didot)', 'serif'],
        serif: ['var(--font-didot)', 'serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
