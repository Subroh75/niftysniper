import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        surface: '#0f1520',
        surface2: '#141d2e',
        accent: '#00c882',
        accent2: '#00a8ff',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        scroll: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(-100%)' } },
      },
      animation: {
        blink: 'blink 1.2s ease-in-out infinite',
        scroll: 'scroll 35s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
