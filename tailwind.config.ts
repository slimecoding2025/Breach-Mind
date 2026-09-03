import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        void: {
          950: "#020617",
          900: "#090d16",
          800: "#0c1220",
          700: "#111827",
          600: "#1a2236",
        },
        cyan: {
          neon: "#22f5ff",
          glow: "#0ff0fc",
        },
        violet: {
          neon: "#a855f7",
          glow: "#c084fc",
        },
        severity: {
          critical: "#ff3366",
          high: "#ff9d3d",
          medium: "#ffd23f",
          low: "#4ade80",
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 5px rgba(34,245,255,0.6), 0 0 20px rgba(34,245,255,0.35), 0 0 40px rgba(34,245,255,0.15)",
        "neon-violet": "0 0 5px rgba(168,85,247,0.6), 0 0 20px rgba(168,85,247,0.35), 0 0 40px rgba(168,85,247,0.15)",
        "neon-critical": "0 0 6px rgba(255,51,102,0.7), 0 0 24px rgba(255,51,102,0.35)",
        "neon-high": "0 0 6px rgba(255,157,61,0.7), 0 0 24px rgba(255,157,61,0.3)",
        "neon-medium": "0 0 6px rgba(255,210,63,0.7), 0 0 24px rgba(255,210,63,0.3)",
        "panel": "0 8px 40px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "grid-cyber":
          "linear-gradient(rgba(34,245,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,245,255,0.06) 1px, transparent 1px)",
        "radial-fade": "radial-gradient(circle at 50% 0%, rgba(34,245,255,0.12), transparent 60%)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        "flow-dash": "flow-dash 1.2s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "flow-dash": {
          to: { strokeDashoffset: "-20" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
