/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1F2024", // Elegant dark charcoal / black tone
        accent: "#FF5A5F", // Coral pink/red highlight accent
        secondary: "#8F92A1", // Soft gray mute
        background: "#FAF7F5", // Soft warm off-white background
        surface: "#FFFFFF", // Pure white card background
        cream: "#F4EFEA", // Pastel neutral badge/pill background
        softRose: "#FDEEDC", // Soft pastel warm accent background
        textPrimary: "#1F2024", // Primary heading/text color
        textMuted: "#71747D", // Secondary body/label text color
        borderLight: "#EFEFEF", // Light clean border tone
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        heading: ['"Playfair Display"', 'Poppins', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
