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
        'off-white': '#f4f3f0',
        'border-subtle': '#dbdad7',
        // Semantic tokens — read from CSS variables (globals.css) so every
        // component using these classes re-themes automatically with the
        // `.dark` class, instead of hardcoding literal hex per component.
        bg: 'var(--bg-base)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'text-primary': 'var(--text-base)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        // key is "theme" (not "border-theme") so the generated utility is
        // exactly `border-theme`, matching this project's design spec.
        theme: 'var(--border-theme)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
