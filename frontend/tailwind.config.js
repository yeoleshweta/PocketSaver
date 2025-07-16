/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#008080',
        secondary: '#E0F8F8',
        accent: '#FFD700',
      },
    },
  },
  plugins: [],
};