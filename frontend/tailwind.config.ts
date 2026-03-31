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
        // Background system
        "bg-void":    "#080b0f",
        "bg-surface": "#0d1117",
        "bg-raised":  "#111820",
        "bg-overlay": "#1a2332",
        // Neon accents
        "neon-amber":      "#ffb347",
        "neon-amber-dim":  "#a05c00",
        "neon-cyan":       "#00e5ff",
        "neon-cyan-dim":   "#004d5a",
        "neon-purple":     "#bf5fff",
        "neon-purple-dim": "#3d0a66",
        "neon-green":      "#39ff14",
        "neon-red":        "#ff2052",
        // Text
        "text-primary":   "#e8eaed",
        "text-secondary": "#8899aa",
        "text-dim":       "#445566",
        "text-amber":     "#ffb347",
        "text-code":      "#00e5ff",
        // Borders
        "border-subtle": "#1e2d3d",
        "border-active": "#ffb347",
      },
      fontFamily: {
        mono:    ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        display: ["Orbitron", "Share Tech Mono", "monospace"],
        body:    ["Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-amber":  "0 0 20px rgba(255,179,71,0.25), 0 0 4px rgba(255,179,71,0.15)",
        "glow-cyan":   "0 0 20px rgba(0,229,255,0.25), 0 0 4px rgba(0,229,255,0.15)",
        "glow-purple": "0 0 20px rgba(191,95,255,0.25), 0 0 4px rgba(191,95,255,0.15)",
        "glow-green":  "0 0 20px rgba(57,255,20,0.25), 0 0 4px rgba(57,255,20,0.15)",
        "glow-red":    "0 0 20px rgba(255,32,82,0.25), 0 0 4px rgba(255,32,82,0.15)",
      },
      animation: {
        "pulse-slow":    "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "scan-line":     "scanLine 8s linear infinite",
        "ticker":        "ticker 40s linear infinite",
        "glow-breathe":  "glowBreathe 4s ease-in-out infinite",
        "flicker":       "flicker 0.3s ease-out forwards",
        "status-pulse":  "statusPulse 2s ease-in-out infinite",
        "shimmer":       "shimmer 2s linear infinite",
      },
      keyframes: {
        scanLine: {
          "0%":   { transform: "translateY(-100%)", opacity: "0.04" },
          "100%": { transform: "translateY(100vh)", opacity: "0.04" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glowBreathe: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        flicker: {
          "0%":   { opacity: "0" },
          "20%":  { opacity: "1" },
          "40%":  { opacity: "0.2" },
          "60%":  { opacity: "1" },
          "80%":  { opacity: "0.5" },
          "100%": { opacity: "1" },
        },
        statusPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 currentColor" },
          "50%":      { boxShadow: "0 0 0 6px transparent" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
