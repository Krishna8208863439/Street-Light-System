/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020817',
          900: '#0a0f1e',
          800: '#0d1526',
          700: '#111b33',
          600: '#1a2848',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          glow: '#00f5ff',
        },
        amber: {
          glow: '#ffb347',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-ping': 'glow-ping 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'count-up 0.4s ease-out',
      },
      keyframes: {
        'glow-ping': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(34, 211, 238, 0.4)',
        'amber-glow': '0 0 40px rgba(255, 179, 71, 0.6)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
