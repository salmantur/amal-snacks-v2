import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-thmanyah-sans)', 'var(--font-tajawal)', 'system-ui', 'sans-serif'],        'serif-text': ['var(--font-thmanyah-serif-text)', 'serif'],
        'admin-mono': ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        amal: {
          pink: 'hsl(var(--amal-pink))',
          'pink-light': 'hsl(var(--amal-pink-light))',
          yellow: 'hsl(var(--amal-yellow))',
          'yellow-light': 'hsl(var(--amal-yellow-light))',
          grey: 'hsl(var(--amal-grey))',
          'grey-dark': 'hsl(var(--amal-grey-dark))',
        },
        admin: {
          bg: 'var(--admin-bg)',
          header: 'var(--admin-header)',
          ink: 'var(--admin-ink)',
          muted: 'var(--admin-muted)',
          'muted-2': 'var(--admin-muted-2)',
          'muted-3': 'var(--admin-muted-3)',
          border: 'var(--admin-border)',
          'border-soft': 'var(--admin-border-soft)',
          delivery: 'var(--admin-delivery)',
          'delivery-tint': 'var(--admin-delivery-tint)',
          pickup: 'var(--admin-pickup)',
          'pickup-tint': 'var(--admin-pickup-tint)',
          urgent: 'var(--admin-urgent)',
          window: 'var(--admin-window)',
          'window-tint': 'var(--admin-window-tint)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.9) translateY(-6px)', opacity: '0' },
          '60%': { transform: 'scale(1.02) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'pop-out': {
          '0%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(0.92) translateY(-4px)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pop-out': 'pop-out 0.18s ease-in forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
