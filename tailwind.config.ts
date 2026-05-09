import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'maze-wall': '#2d2d2d',
        'maze-floor': '#f5f5f0',
        'robot-body': '#1976d2',
        'sensor-hit': '#ff4444',
        'sensor-miss': '#44ff44',
        'accent': '#6366f1',
        'accent-bg': 'rgba(99, 102, 241, 0.1)',
        'accent-border': 'rgba(99, 102, 241, 0.3)',
        'surface': '#1e1e1e',
        'surface-alt': '#252525',
        'border': '#333333',
        'text': '#e0e0e0',
        'text-muted': '#888888',
      },
    },
  },
  plugins: [],
} satisfies Config;