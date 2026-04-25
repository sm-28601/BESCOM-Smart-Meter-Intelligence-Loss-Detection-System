/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      colors: {
        // Government Navy palette
        gov: {
          navy: '#0a2e5c',
          'navy-light': '#0f3d7a',
          'navy-dark': '#061d3a',
          blue: '#1a5276',
          'blue-light': '#2471a3',
          accent: '#1b4f72',
        },
        // Alert colors
        alert: {
          red: '#c71f16',
          'red-light': '#f8d7da',
          'red-dark': '#8b0000',
          amber: '#d4a017',
          'amber-light': '#fff3cd',
          green: '#1e7e34',
          'green-light': '#d4edda',
        },
        // Neutral grays
        slate: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          150: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        header: '0 2px 4px 0 rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}