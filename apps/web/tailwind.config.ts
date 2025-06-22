import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/ui/tailwind.config';

const config: Pick<Config, 'presets' | 'content'> = {
  presets: [sharedConfig],
  content: ['./app/**/*.tsx', './components/**/*.tsx', '../../packages/ui/src/components/**/*.tsx'],
};

export default config;
