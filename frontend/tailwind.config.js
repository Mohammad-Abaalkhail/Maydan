/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'Arial', 'sans-serif'],
      },
      spacing: {
        'touch': '44px', // Minimum touch target size
      },
      colors: {
        'warning-dark': '#92400E', // Dark text for warning backgrounds
      },
    },
  },
  plugins: [],
}

