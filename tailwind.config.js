/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // The "Medieval" font - import form Google Fonts
        sans: ['Inter', 'sans-serif'],
        // The "Tech Startup" font
        serif: ['Cinzel Decorative', 'serif'],
      },
      colors: {
        wangen: {
          stone: '#1a1a1a', // Deep dark background
          gold: '#d4af37',   // Accent color for luxury/history
          wine: '#722F37',   // Deep red accent
          light: '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
}