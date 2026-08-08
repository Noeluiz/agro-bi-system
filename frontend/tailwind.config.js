export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          700: '#047857',
          800: '#065f46',
        },
        stone: {
          50: '#fafaf9',
        },
        slate: {
          50: '#f8fafc',
          200: '#e2e8f0',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
        },
        amber: {
          50: '#fffbeb',
          800: '#b45309',
        }
      }
    },
  },
  plugins: [],
}
