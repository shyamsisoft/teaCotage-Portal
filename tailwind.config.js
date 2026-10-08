/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          900: '#0F2C24',
          800: '#1B4D3E', // Primary Deep Forest
          700: '#266D58',
          600: '#328D72',
          500: '#3EA88A',
          100: '#E8F5F1',
          50: '#F2FAF7',
          amber: '#D4AF37', // Accent Gold
          gold: '#C59B27',
        },
      },
    },
  },
  plugins: [],
};
