import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // OWT Swiss Brand Colors
        'brand-red': '#99211C',
        'brand-red-dark': '#99211C',
        'brand-red-bright': '#E41919',
        'brand-red-orange': '#E2523F',
        'brand-red-coral': '#E56655',
        'brand-blue': '#2C7CF2',
        'brand-blue-dark': '#263D6C',
        'brand-blue-bright': '#2C7CF2',
        // Neutrals
        'almost-black': '#140406',
        'charcoal': '#2B2E38',
        'gray-custom-50': '#F8F9F9',
        'gray-custom-100': '#F0F0F0',
        'gray-custom-200': '#E0E0E0',
        'gray-custom-300': '#CCCCCC',
        'gray-custom-400': '#BBBBBB',
        'gray-custom-500': '#979797',
        'gray-custom-600': '#696969',
        'gray-custom-700': '#444444',
        'gray-custom-800': '#3B3B3B',
        'gray-custom-900': '#2B2E38',
        // Backgrounds
        'off-white': '#F5F5F5',
        'warm-white': '#F5F5F5',
        'ice-blue': '#F3F8FA',
        'cream-pink': '#FDF0ED',
      },
    },
  },
  plugins: [],
}
export default config
