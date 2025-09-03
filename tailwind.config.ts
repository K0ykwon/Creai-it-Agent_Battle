import type { Config } from "tailwindcss";

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media'
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // add other paths as needed
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1E3A8A', // Example deep blue
      },
      animation: {
        'fadeIn': 'fadeIn 1s ease-in-out forwards',
        'slideDown': 'slideDown 1s ease-in-out forwards',
        'slideUp': 'slideUp 1s ease-in-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow-delayed': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) 1.5s infinite',
        'expandWidth': 'expandWidth 1.5s ease-out forwards',
        'bounce-slow': 'bounce 3s infinite',
        'fadeInUp': 'fadeInUp 1s ease-out forwards',
        'gradient-x': 'gradient-x 3s ease infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        expandWidth: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
