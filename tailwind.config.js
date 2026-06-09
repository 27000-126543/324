/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        forest: {
          50: '#F1F7F4',
          100: '#DCECE3',
          200: '#B4D5C3',
          300: '#86BBA0',
          400: '#579E7C',
          500: '#348260',
          600: '#1B4D3E',
          700: '#143D31',
          800: '#0F2E25',
          900: '#0A1F19',
          950: '#050F0C',
        },
        loam: {
          50: '#FBF7EC',
          100: '#F4EAD0',
          200: '#EAD49B',
          300: '#DFBE66',
          400: '#B9952F',
          500: '#8B6914',
          600: '#6E5210',
          700: '#523D0C',
          800: '#372908',
          900: '#1B1404',
        },
        cream: {
          DEFAULT: '#F5F1E8',
          dark: '#E8DFCB',
        },
        status: {
          info: '#2563EB',
          warning: '#E67E22',
          critical: '#C0392B',
          success: '#27AE60',
          pending: '#8B6914',
          fallback: '#7C3AED',
        }
      },
      fontFamily: {
        display: ['Lora', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(27 77 62 / 0.08)',
        cardHover: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 16px 32px -8px rgb(27 77 62 / 0.12)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.6)',
        ring: '0 0 0 4px rgb(27 77 62 / 0.1)',
        glowSuccess: '0 0 24px -4px rgb(39 174 96 / 0.4)',
        glowCritical: '0 0 24px -4px rgb(192 57 43 / 0.4)',
      },
      backgroundImage: {
        'forest-gradient': 'linear-gradient(135deg, #1B4D3E 0%, #348260 100%)',
        'forest-gradient-soft': 'linear-gradient(135deg, rgba(27,77,62,0.1) 0%, rgba(52,130,96,0.05) 100%)',
        'loam-gradient': 'linear-gradient(135deg, #8B6914 0%, #B9952F 100%)',
        'card-texture': 'radial-gradient(1200px 600px at 10% -10%, rgba(52,130,96,0.08), transparent 60%), radial-gradient(800px 400px at 90% 110%, rgba(139,105,20,0.06), transparent 50%)',
        'noise': "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.11 0 0 0 0 0.30 0 0 0 0 0.24 0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scroll-in': 'scrollIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shake': 'shake 0.6s cubic-bezier(.36,.07,.19,.97) both',
        'progress': 'progress 1.5s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scrollIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%,90%': { transform: 'translateX(-1px)' },
          '20%,80%': { transform: 'translateX(2px)' },
          '30%,50%,70%': { transform: 'translateX(-4px)' },
          '40%,60%': { transform: 'translateX(4px)' },
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
