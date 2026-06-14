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
        primary: '#0066cc',
        secondary: '#f39c12',
        danger: '#e74c3c',
        success: '#27ae60',
        warning: '#f39c12',
        info: '#3498db',
      },
    },
  },
  plugins: [],
};
