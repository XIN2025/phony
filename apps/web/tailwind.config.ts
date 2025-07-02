import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/ui/tailwind.config';

const config: Pick<Config, 'presets' | 'content'> = {
  presets: [sharedConfig],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/components/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
