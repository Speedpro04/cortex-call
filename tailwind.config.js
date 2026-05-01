/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        cortex: {
          primary: '#0ea5e9',
          accent1: '#06b6d4',
          accent2: '#14b8a2',
          border: '#38bdf8',
          bg: '#f0f9ff',
          text1: '#0c4a6e',
          text2: '#f0f9ff',
        }
      },
    },
  },
  plugins: [],
}
