/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Luxurious Meal Planner Palette
        background: '#FEFDFB',
        cream: {
          50: '#FEFDFB',
          100: '#FAF7F2',
          200: '#F5F0E8',
          300: '#EDE5D8',
          400: '#E0D4C3',
          500: '#D0C0A8',
          600: '#B8A78C',
          700: '#9A8A70',
          800: '#7A6D58',
          900: '#5A5040',
        },
        coral: {
          50: '#FFF8F0',
          100: '#FFE8D6',
          200: '#FFD4B8',
          300: '#FFAB91',
          400: '#FF8A65',
          500: '#E8A87C',
          600: '#D4956A',
          700: '#B8785A',
          800: '#8B5A3C',
          900: '#5C3A28',
        },
        // Primary - elegant charcoal
        primary: {
          50: '#F9FAFB',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#2D2D2D',
        },
      },
      backgroundColor: {
        DEFAULT: '#FEFDFB',
      },
      borderRadius: {
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
