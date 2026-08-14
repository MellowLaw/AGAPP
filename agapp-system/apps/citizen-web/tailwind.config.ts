import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pastel-pink': '#F497A2',
        'sage-green': '#A2B59F',
        'dusty-blue': '#9FADB5',
        'warm-sand': '#D9CDB8',
        'off-white': '#FFFCF5',
        bg: 'var(--bg-base)',
        'bg-alt': 'var(--bg-alt)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        card: 'var(--surface)',
        'card-alt': 'var(--surface-alt)',
        chip: 'var(--chip)',
        'text-primary': 'var(--text-base)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        theme: 'var(--border-theme)',
        accent: 'var(--accent)',
        'accent-contrast': 'var(--accent-contrast)',
        'accent-soft': 'var(--accent-soft)',
        'accent-icon': 'var(--accent-icon, var(--accent))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        serif: ['var(--font-serif)', 'Lora', 'serif'],
        octarine: ['Octarine-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
