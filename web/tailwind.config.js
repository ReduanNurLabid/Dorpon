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
        obsidian: {
          bg: '#0A0E0D',
          lowest: '#0B0F0E',
          glow: '#11261F',
          high: '#272B2A',
          container: '#1C201F',
          pill: '#181C1B',
        },
        mint: {
          DEFAULT: '#34D399',
          bright: '#5AF0B3',
          dark: '#059669',
        },
        gold: {
          DEFAULT: '#EAB308',
          bright: '#FACC15',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8E9F97',
          tertiary: 'rgba(142, 159, 151, 0.6)',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          active: 'rgba(255, 255, 255, 0.12)',
          highlight: 'rgba(52, 211, 153, 0.12)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Hind Siliguri"', 'sans-serif'],
        serif: ['"Lora"', '"Noto Serif Bengali"', 'serif'],
        bangla: ['"Hind Siliguri"', 'sans-serif'],
      },
      borderRadius: {
        'card': '28px',
        'tile': '20px',
        'lg': '24px',
        'md': '16px',
        'pill': '9999px',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.9' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
