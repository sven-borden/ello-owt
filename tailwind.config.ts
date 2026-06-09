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
        'brand-red-dark': '#7A1A16',
        'brand-red-bright': '#E41919',
        'brand-red-orange': '#E2523F',
        'brand-red-coral': '#E56655',
        'brand-blue': '#2C7CF2',
        'brand-blue-dark': '#263D6C',
        'brand-blue-bright': '#2C7CF2',
        'brand-gold': '#C4A962',
        'brand-gold-light': '#F4E4C1',
        // Neutrals (warm-tinted toward the brand-red hue, no pure grays)
        'almost-black': '#140406',
        'charcoal': '#2B2E38',
        'gray-custom-50': '#FAF8F8',
        'gray-custom-100': '#F2EFEE',
        'gray-custom-200': '#E5E0DF',
        'gray-custom-300': '#D0CBCA',
        'gray-custom-400': '#BEB8B7',
        'gray-custom-500': '#9B9493',
        'gray-custom-600': '#6B6563',
        'gray-custom-700': '#46403F',
        'gray-custom-800': '#3D3837',
        'gray-custom-900': '#2B2729',
        // Backgrounds
        'off-white': '#F7F4F3',
        'warm-white': '#F7F4F3',
        'ice-blue': '#F3F8FA',
        'cream-pink': '#FDF0ED',
      },
    },
  },
  plugins: [],
}
export default config
