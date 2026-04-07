/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#4F46E5",   // Indigo-600
          dark:    "#3730A3",   // Indigo-800
          light:   "#EEF2FF",   // Indigo-50
        },
        accent: {
          DEFAULT: "#10B981",   // Emerald-500
          dark:    "#059669",   // Emerald-600
          light:   "#ECFDF5",   // Emerald-50
        },
      },
      boxShadow: {
        card:    "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08)",
        nav:     "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
