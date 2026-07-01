/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E91E63", // Rose Pink
        secondary: "#6A1B9A", // Deep Purple
        highlight: "#FFC107", // Gold
        background: "#FFFFFF", // White
        textPrimary: "#2E2E2E", // Dark Gray
        surface: "#F5F5F5", // Light Gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
