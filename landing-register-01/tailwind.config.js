const { fontFamily } = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: ["./pages/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  },
  theme: {
    container: {
      center: true,
    },
    extend: {
      // tailwind colors.
      colors: {
        primary: "#235789",
        secondary: "#F1D302",
        accent: "#ED1C24",
        neutral: "#020100",
        white: "#FDFFFC",
        black: "#020100",
        grey: "#40424F",
        grey1: "#7E7E7E",
        lightGrey: '#ECEAEA',
        lightGrey2: "#DBDBDB",
        lightGrey1: '#D3D3D3',
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
      animation: {
        text: 'text 5s ease infinite',
        blob: "blob 7s infinite",
        'gradient-x': 'gradient-x 8s ease infinite',
        'gradient-y': 'gradient-y 8s ease infinite',
        'gradient-xy': 'gradient-xy 8s ease infinite',
      },
      keyframes: {
        text: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "tranlate(0px, 0px) scale(1)",
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
    plugin(function ({ addBase }) {
      // add base font size of 14px on small screens
      addBase({
        'html': { fontSize: "12px" },
        'td': { backgroundColor: "#fff" }
      })
      // addBase({
      //   // add base font size of 16px on >= xl screens
      //   '@screen xl': {
      //     'html': { fontSize: "14px" },
      //     'td': { backgroundColor: "#fff" }
      //   },
      //   // add base font size of 20px on >= 3xl screens
      //   '@screen 3xl': {
      //     'html': { fontSize: "18px" },
      //     'td': { backgroundColor: "#fff" }
      //   },
      // })
    }),
  ],
}
