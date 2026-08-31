/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f4', 100: '#d6ede6', 200: '#aedccd', 300: '#7cc4ae',
          400: '#4aa88d', 500: '#2b8f74', 600: '#1f725d', 700: '#1b5b4b',
          800: '#17493d', 900: '#123a31',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('daisyui')],
  daisyui: { themes: ['light'], logs: false },
};
