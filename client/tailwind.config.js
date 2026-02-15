/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a84c',
          light: '#dbb85a',
          dark: '#a88a3a',
          muted: 'rgba(201, 168, 76, 0.15)',
        },
        primary: {
          purple: '#9945ff',
          green: '#14f195',
          blue: '#60a5fa',
          pink: '#f472b6',
        },
        dark: {
          bg: '#050505',
          surface: '#0c0c0c',
          elevated: '#141414',
          card: '#111111',
          border: '#1e1e1e',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'app-xs': '2px',
        'app-sm': '4px',
        'app': '8px',
        'app-md': '8px',
        'app-lg': '12px',
        'app-xl': '16px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #c9a84c 0%, #dbb85a 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #1a1a1a 0%, #111111 100%)',
        'gradient-dark': 'linear-gradient(135deg, #050505 0%, #0c0c0c 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'indeterminate': 'indeterminate 1.5s infinite ease-in-out',
        'rotate': 'rotate 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        rotate: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(201, 168, 76, 0.1)',
        'gold-lg': '0 0 30px rgba(201, 168, 76, 0.15)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
