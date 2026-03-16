import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: [
    "index.html",
    "./src/**/*.{ts,js}",
    "./components/**/*.{ts,js}",
    "./pages/**/*.{ts,js}",
  ],
  experimental: {
    classRegex: [
      // cn("...") and cn(["...", "..."])
      ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
      // class: "..."  or  class: `...`
      ["class:\\s*[\"'`]([^\"'`]*)[\"'`]"],
    ],
  },
  theme: {
    extend: {
      zIndex: {
        0: "0",
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".thin-scrollbar": {
          "scrollbar-width": "0",
          "scrollbar-color": "#d3d3d3",
          "scroll-padding-left": "10px",
        },
        ".thin-scrollbar::-webkit-scrollbar": {
          width: "3px",
          height: "3px",
          "background-color": "transparent",
        },
        ".thin-scrollbar::-webkit-scrollbar-thumb:hover": {
          scale: "2",
        },
        ".thin-scrollbar::-webkit-scrollbar-thumb": {
          "background-color": "#d3d3d3",
          "border-radius": "10px",
        },
      });
    }),
  ],
};
