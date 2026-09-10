import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        urna: {
          bg: "#d4d4d8", // cinza da carcaça
          panel: "#e4e4e7",
          dark: "#18181b",
          lcd: "#f8fafc",
          keypad: "#27272a",
          btnCorrige: "#f97316",
          btnCorrigeHover: "#ea580c",
          btnConfirma: "#22c55e",
          btnConfirmaHover: "#16a34a",
          btnBranco: "#ffffff",
          btnBrancoHover: "#f1f5f9",
          keyDigit: "#1e1e24",
          keyDigitHover: "#2e2e38",
        },
      },
      height: {
        dvh: "100dvh",
      },
      minHeight: {
        dvh: "100dvh",
      },
      maxHeight: {
        dvh: "100dvh",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        blink: "blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
