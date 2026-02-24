/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2228D6',
        },
      },
      maxWidth: {
        '160': '40rem',
        '165': '41.25rem',
        '355': '88.75rem',
      },
    },
  },
  plugins: [],
};