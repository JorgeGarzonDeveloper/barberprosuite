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
        background: "#0a0a0f",
        primary: "#c9a227",
        "primary-dark": "#a07d1a",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.06)",
        "text-primary": "#ffffff",
        "text-secondary": "rgba(255,255,255,0.5)",
        "text-tertiary": "rgba(255,255,255,0.25)",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
