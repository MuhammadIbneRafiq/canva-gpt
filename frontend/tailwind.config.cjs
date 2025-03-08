/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bbd7fe',
          300: '#8ab6fd',
          400: '#5a8ef9',
          500: '#3b68f3',
          600: '#2c4ce7',
          700: '#2639d6',
          800: '#2531ad',
          900: '#232f8a',
          950: '#1a1d54',
        },
        canvas: {
          red: '#D41B2C',
          orange: '#F2801E',
          green: '#00AC18',
          blue: '#0374B5',
          purple: '#8D3DEB',
          dark: '#2D3B45',
          light: '#F5F5F5',
        },
      },
      boxShadow: {
        'message': '0 2px 5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

