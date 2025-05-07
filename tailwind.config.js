/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik-Regular', 'sans-serif'],
        "rubik-bold": ["Rubik-Bold", "sans-serif"],
        "rubik-ExtraBold": ["Rubik-ExtraBold", "sans-serif"],
        "rubik-Light": ["Rubik-Light", "sans-serif"],
        "rubik-Medium": ["Rubik-Medium", "sans-serif"],
        "rubik-Regular": ["Rubik-Regular", "sans-serif"],
        "rubik-SemiBold": ["Rubik-SemiBold", "sans-serif"],
      },
      colors: {
        primary: {
          100: '#0E5CB3',
          200: '#2583C1',
          300: '#40AFD2',
        },
        accent: {
          100: '#FBFBFD',
        },
        black: {
          DEFAULT: '#000000',
          100: '#8C8E98',
          200: '#666876',
          300: '#191D31',
        },
        danger: '#F75555',
      },
    },
  },
  plugins: [],
};
