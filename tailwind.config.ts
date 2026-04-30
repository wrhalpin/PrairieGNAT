import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        tlp: {
          clear: '#ffffff',
          green: '#33cc33',
          amber: '#ffcc00',
          red: '#ff3333',
          'amber-strict': '#cc6600',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} satisfies Config;
