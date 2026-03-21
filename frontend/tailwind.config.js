/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A8E063',
          DEFAULT: '#56AB2F',
        },
        background: '#F6F7F9',
        card: '#FFFFFF',
        text: {
          primary: '#1A1C1E',
          secondary: '#6C727A',
        }
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'premium': '0 10px 40px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #A8E063 0%, #56AB2F 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
