import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        adride: {
          orange: '#FF6B35',
          'orange-light': '#FF9A35',
          'orange-dim': '#AA6633',
          gray: '#555555',
          highlight: '#FFAA00',
        },
        panel: {
          bg: 'rgba(15, 18, 24, 0.92)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
