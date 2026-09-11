/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1116',
        'ink-soft': '#161B22',
        parchment: '#F7F4EE',
        brass: '#C9A464',
        'brass-soft': '#E4CE9C',
        emerald: '#1F3A34',
        stone: '#8B8A85',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        wide2: '0.08em',
      },
      boxShadow: {
        pass: '0 30px 60px -20px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
};
