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
        // Meal Planner Palette - Soft Beige/Cream
        background: '#F5E6D3', // Soft beige
        cream: {
          50: '#FFFDF7',
          100: '#FFF8E7', // Light cream accent
          200: '#FEF3C7',
          300: '#FDE68A',
          400: '#FBBF24',
          500: '#F5DEB3', // Main wheat
          600: '#D9C89C',
          700: '#B8A67C',
          800: '#8B7355',
          900: '#5C4A33',
        },
        // Alias primary to black/dark
        primary: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      backgroundColor: {
        DEFAULT: '#F5DEB3',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
