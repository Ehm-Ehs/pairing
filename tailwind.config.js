/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        heading: ["var(--font-outfit)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        sora: ["var(--font-sora)", "sans-serif"],
      },
    },
  },
  plugins: [],
}

