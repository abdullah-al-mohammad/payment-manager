/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0C1220",
        surface: "#111827",
        card:    "#1A2535",
        "card-hi": "#1F2E42",
        border:  "#253044",
        "border-hi": "#2E3D56",
        teal:    "#00C896",
        "teal-dim": "rgba(0,200,150,0.10)",
        amber:   "#F59E0B",
        emerald: "#34D399",
        sky:     "#60A5FA",
        violet:  "#A78BFA",
        rose:    "#F87171",
        muted:   "#94A3B8",
        faint:   "#4B5A70",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
