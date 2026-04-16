import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["'Iowan Old Style'", "'Palatino Linotype'", "'Book Antiqua'", "Georgia", "serif"]
      },
      colors: {
        canvas: "#ebedea",
        ink: "#2d322f",
        forest: "#1e2420",
        accent: "#4ba3e3"
      },
      boxShadow: {
        halo: "0 20px 60px -15px rgba(0,0,0,0.35)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
