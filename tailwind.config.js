/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0c',
        primary: '#5865F2', // Discord Blue
        secondary: '#eb459e',
        accent: '#fee75c',
        glass: 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'dark-gradient': 'radial-gradient(circle at top left, #1a1a2e, #0a0a0c)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(118, 75, 162, 0.4)',
        'neon-blue': '0 0 20px rgba(88, 101, 242, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
