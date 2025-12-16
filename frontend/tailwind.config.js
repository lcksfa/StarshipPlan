/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 太空主题色彩
        space: {
          black: '#0a0a0f',
          dark: '#1a1a2e',
          blue: '#16213e',
          purple: '#0f3460',
        },
        galaxy: {
          blue: '#0066cc',
          purple: '#9933ff',
          pink: '#ff00ff',
          cyan: '#00ffff',
        },
        // 等级色彩
        bronze: '#cd7f32',
        silver: '#c0c0c0',
        gold: '#ffd700',
        diamond: '#b9f2ff',
        ruby: '#e0115f'
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.8)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        shooting: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(100px) translateY(100px)' },
        }
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f3460 100%)',
        'star-field': "radial-gradient(circle, #ffffff 1px, transparent 1px)",
        'galaxy': "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)"
      }
    },
  },
  plugins: [],
}
