/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          light: '#0F2040',
          medium: '#152d4f',
        },
        gold: {
          DEFAULT: '#F0B429',
          light: '#F7CC6A',
          dark: '#C4911A',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontSize: {
        'driving': ['2rem', { lineHeight: '1.3' }],
        'driving-lg': ['2.5rem', { lineHeight: '1.2' }],
      },
      minHeight: {
        'btn': '80px',
      },
    },
  },
  plugins: [],
}
