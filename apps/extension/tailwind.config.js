/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  content: ['./src/**/*.{tsx,html}'],
  theme: {
    extend: {
      spacing: {
        '4xs': '1px',
        '3xs': '2px',
        '2xs': '4px',
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '64px',
      },
      borderRadius: {
        pill: '9999px',
        lg: '24px',
        md: '16px',
        sm: '12px',
        xs: '4px',
        '2xs': '8px',
      },
      borderWidth: {
        1: '1px',
        2: '2px',
      },
      fontSize: {
        xs: '0.75rem' /* 'tiny', 12px */,
        sm: '0.875rem' /* 'smaller', 14px */,
        base: '1rem' /*'small', 16px */,
        lg: '1.125rem' /* 'body', 18px */,
        xl: '1.75rem' /* 'title', 28px */,
        '2xl': '2.5rem' /* 'headline', 40px */,
      },
      backgroundImage: {
        'elytro-background': 'var(--elytro-background-image)',
        'elytro-btn-bg': 'var(--elytro-btn-bg)',
      },
      backgroundColor: {
        gray: {
          900: '#3C3F45',
          750: '#676B75',
          600: '#95979C',
          450: '#BDC0C7',
          300: '#E2E2E2',
          150: '#F2F3F5',
          0: '#FFFFFF',
        },
      },
      colors: {
        // Elytro Theme Overrides
        gray: {
          900: '#3C3F45',
          750: '#676B75',
          600: '#95979C',
          450: '#BDC0C7',
          300: '#E2E2E2',
          150: '#F2F3F5',
          0: '#FFFFFF',
        },
        'black-blue': '#161F36',
        'dark-blue': '#234759',
        blue: '#64ACD0',
        'light-blue': '#CEE2EB',
        'dark-green': '#97B59C',
        green: '#209D7F',
        'light-green': '#D4F4C1',
        'dark-red': '#61203F',
        red: '#FF7066',
        'light-red': '#FCE9EA',
        purple: '#ECE6F7',

        // Start of Selection
        background: 'var(--background)',
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
        lg: '0px 12px 24px 0px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
