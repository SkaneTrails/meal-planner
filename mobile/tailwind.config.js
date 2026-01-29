/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Meal Planner Palette - Streamlit Design
        background: '#F5F5DC', // Beige background
        sage: {
          50: '#f4f5ef',
          100: '#e8eadf',
          200: '#d5d9c4',
          300: '#c2c8a8',
          400: '#ADB380', // Main sage green
          500: '#97a068',
          600: '#7A8A5D', // Darker sage for active states
          700: '#5d6847',
          800: '#4a5339',
          900: '#3d442f',
        },
        peach: {
          50: '#fdfaf5',
          100: '#faf4e9',
          200: '#f5e9d4',
          300: '#EFD5A9', // Main peach
          400: '#e5c289',
          500: '#d9ac68',
          600: '#c99448',
          700: '#a87a3a',
          800: '#886332',
          900: '#70522b',
        },
        // Alias primary to sage for convenience
        primary: {
          50: '#f4f5ef',
          100: '#e8eadf',
          200: '#d5d9c4',
          300: '#c2c8a8',
          400: '#ADB380',
          500: '#97a068',
          600: '#7A8A5D',
          700: '#5d6847',
          800: '#4a5339',
          900: '#3d442f',
        },
      },
      backgroundColor: {
        DEFAULT: '#F5F5DC',
      },
    },
  },
  plugins: [],
};
