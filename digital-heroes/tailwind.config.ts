import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        emerald: {
          300: "#6ee7b7",
          400: "#34d399",
        },
      },
    },
  },
  plugins: [],
};

export default config;
