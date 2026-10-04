/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1714',
        paper: '#f6f1e8',
        copper: '#9a3412',
        line: '#e4d9cb',
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 12px 32px rgba(28, 25, 23, 0.04)',
      },
    },
  },
  plugins: [],
};
