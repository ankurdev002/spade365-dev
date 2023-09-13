const { fontFamily } = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      // tailwind colors. TODO: update these colors from admin panel
      colors: {
        primary: "#235789",
        secondary: "#F1D302",
        accent: "#ED1C24",
        neutral: "#020100",
        white: "#FDFFFC",
        black: "#020100",
      },
      fontFamily: {
        sans: ['var(--font-poppins)', ...fontFamily.sans],
      },
      screens: {
        '3xl': '2000px',
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    plugin(function ({ addBase }) {
      // add base font size of 14px on small screens
      addBase({
        'html': { fontSize: "12px" },
      })
      addBase({
        // add base font size of 16px on >= xl screens
        '@screen xl': {
          'html': { fontSize: "14px" },
        },
        // add base font size of 20px on >= 3xl screens
        '@screen 3xl': {
          'html': { fontSize: "18px" },
        },
      })
    }),
  ],
}
