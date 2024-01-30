import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
let colors = require('tailwindcss/colors')
delete colors['lightBlue']
delete colors['warmGray']
delete colors['trueGray']
delete colors['coolGray']
delete colors['blueGray']
colors = { ...colors, ...{ transparent: 'transparent' } }

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        noise: 'url("/bg.png")',
        fade: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.67) 30%, rgba(0, 0, 0, 0.82) 67%, black 100%)",
      },
      fontFamily: {
        jost: ["var(--font-jost)", ...fontFamily.sans],
        "roboto-mono": ["var(--font-roboto-mono)", ...fontFamily.sans],
      },
      screens: {
        tall: { raw: "(min-height: 960px)" },
        sm: "640.1px",
        md: "768.1px",
        lg: "1024.1px",
        xl: "1280.1px",
        xxl: "1536.1px",
      },
    },
    colors: {
      ...colors,
      purple: "#8c3dd8",
      blue: "#086cd9",
      "light-blue": "#62c6f8",
      green: "#6ed5a3",
      yellow: "#eef081",
      red: "#d56e6e",
      neutral: {
        100: "#FFFFFF",
        200: "#F9F9F9",
        300: "#F1F1F1",
        400: "#DADADA",
        500: "#AAAAAA",
        600: "#565656",
        700: "#161616",
        800: "#020202",
      },
    },

    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '50%': { opacity: '1' },
        '100%': { opacity: '1' },
      }
    },
    animation: {
      fadeIn: 'fadeIn 2s ease-in-out forwards',
    }
  },
  plugins: [require("@headlessui/tailwindcss")],
} satisfies Config;

export default config;
