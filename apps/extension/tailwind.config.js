/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  content: ['./src/**/*.{tsx,html}'],
  theme: {
    extend: {
      spacing: {
        '4xs': '0.0625rem', // 1px
        '3xs': '0.125rem', // 2px
        '2xs': '0.25rem', // 4px
        xs: '0.375rem', // 6px
        sm: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        '4xl': '2.5rem', // 40px
        '5xl': '4rem', // 64px
      },
      borderRadius: {
        pill: '9999rem',
        lg: '1.5rem', // 24px
        md: '1rem', // 16px
        sm: '0.75rem', // 12px
        xs: '0.25rem', // 4px
        '2xs': '0.5rem', // 8px
      },
      borderWidth: {
        1: '0.0625rem', // 1px
        2: '0.125rem', // 2px
      },
      fontSize: {
        xs: '0.75rem' /* 'tiny', 12px */,
        sm: '0.875rem' /* 'smaller', 14px */,
        base: '1rem' /*'small', 16px */,
        lg: '1.1rem' /* 'body', 18px */,
        xl: '1.75rem' /* 'title', 28px */,
        '2xl': '2.5rem' /* 'headline', 40px */,
      },
      backgroundImage: {
        'elytro-background': 'var(--elytro-background-image)',
        'elytro-btn-bg': 'var(--elytro-btn-bg)',
      },
      colors: {
        // Elytro Theme Colors
        gray: {
          900: '#3c3f45',
          750: '#676b75',
          600: '#95979c',
          450: '#bdc0c7',
          300: '#e2e2e2',
          150: '#ededed',
          50: '#f4f4f4',
          0: '#ffffff',
        },
        blue: {
          900: '#05131a',
          750: '#0a2533',
          600: '#134965',
          450: '#7eaabf',
          300: '#cee2eb',
          150: '#e7f1f5',
          50: '#f3f8fa',
        },
        green: {
          900: '#0c2d1a',
          750: '#175934',
          600: '#2db267',
          450: '#7ace8c',
          300: '#c6eab0',
          150: '#d6ebca',
          50: '#eff1ea',
        },
        red: {
          900: '#8b433d',
          750: '#d35950',
          600: '#eb9d97',
          450: '#f4c9c5',
          300: '#f9dfdc',
          150: '#fbeae8',
          50: '#faf2f2',
        },
        brown: {
          900: '#4f3526',
          750: '#9d694b',
          600: '#b2856c',
          450: '#cfb4a3',
          300: '#ece2da',
          150: '#f5f0ec',
          50: '#faf8f6',
        },
        white: '#ffffff',
        overlay: 'rgba(22, 42, 54, 0.26)',

        // Start of Selection
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
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
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
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        hover: {
          primary: 'hsl(var(--hover-primary))',
          primaryForeground: 'hsl(var(--hover-primary-foreground))',
          secondary: 'hsl(var(--hover-secondary))',
          secondaryForeground: 'hsl(var(--hover-secondary-foreground))',
        },
      },
      boxShadow: {
        lg: '0 12px 16px -4px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwindcss'), require('autoprefixer')],
};
