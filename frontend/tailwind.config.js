/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        vogue: ['"VeryVogue"', 'sans-serif'],
      },
      colors: {
        vogueDark: '#031130',
        vogueBlue: '#185DF1',
        vogueLight: '#F3F7FE',
      },
    },
  },
  plugins: [],
}