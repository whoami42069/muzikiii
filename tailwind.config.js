/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // DAW-specific colors
        'daw-bg': '#1a1a2e',
        'daw-surface': '#16213e',
        'daw-accent': '#0f3460',
        'daw-highlight': '#e94560',
        'daw-text': '#eaeaea',
        'daw-muted': '#6c757d',
        // Mixer colors
        'meter-green': '#00ff00',
        'meter-yellow': '#ffff00',
        'meter-red': '#ff0000',
        // Visualizer colors
        'viz-bass': '#ff6b6b',
        'viz-mid': '#4ecdc4',
        'viz-treble': '#45b7d1'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        meter: 'meter 0.1s ease-out'
      },
      keyframes: {
        meter: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' }
        }
      }
    }
  },
  plugins: []
}
