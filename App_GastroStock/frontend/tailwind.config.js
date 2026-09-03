/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: 'rgb(var(--c-surface) / <alpha-value>)',
      black: '#000000',
      gray: {
        50: 'rgb(var(--c-gray-50) / <alpha-value>)',
        100: 'rgb(var(--c-gray-100) / <alpha-value>)',
        200: 'rgb(var(--c-gray-200) / <alpha-value>)',
        300: 'rgb(var(--c-gray-300) / <alpha-value>)',
        400: 'rgb(var(--c-gray-400) / <alpha-value>)',
        500: 'rgb(var(--c-gray-500) / <alpha-value>)',
        600: 'rgb(var(--c-gray-600) / <alpha-value>)',
        700: 'rgb(var(--c-gray-700) / <alpha-value>)',
        800: 'rgb(var(--c-gray-800) / <alpha-value>)',
        900: 'rgb(var(--c-gray-900) / <alpha-value>)',
      },
      red: {
        50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 400: '#f87171',
        500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b',
      },
      green: {
        50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 400: '#4ade80',
        500: '#22c55e', 600: '#16a34a', 700: '#15803d',
      },
      amber: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 400: '#fbbf24',
        500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e',
      },
      blue: { 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb' },
      purple: { 100: '#f3e8ff', 500: '#a855f7', 600: '#9333ea' },
      yellow: { 100: '#fef9c3', 600: '#ca8a04' },
      teal: { 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488' },
      rose: { 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48' },
      indigo: { 100: '#e0e7ff', 500: '#6366f1' },
      cyan: { 100: '#cffafe', 500: '#06b6d4', 600: '#0891b2' },
      violet: { 100: '#ede9fe', 500: '#8b5cf6' },
      emerald: { 100: '#d1fae5', 600: '#059669' },
      slategray: { DEFAULT: '#64748b' },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          dark: 'rgb(var(--c-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--c-primary-light) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          muted: 'rgb(var(--c-surface-muted) / <alpha-value>)',
        },
        app: {
          DEFAULT: 'rgb(var(--c-bg) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--c-sidebar) / <alpha-value>)',
          dark: 'rgb(var(--c-sidebar-dark) / <alpha-value>)',
          light: 'rgb(var(--c-sidebar-light) / <alpha-value>)',
        },
        'on-accent': {
          DEFAULT: '#ffffff',
        }
      },
    },
  },
  plugins: [],
}
