/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Primary (dark) used for text, headings, and subtle surfaces
        brand: {
          DEFAULT: "#0f172a",   // Primary dark
          dark:    "#0b1220",
          light:   "#F8FAFC",
        },
        // Accent (blue) used for CTAs, highlights and focus states
        accent: {
          DEFAULT: "#3b82f6",   // Blue-500
          dark:    "#2563eb",   // Blue-600
          light:   "#eff6ff",
        },
      },
      boxShadow: {
        // Modern soft shadows for a premium feel
        card:        "0 10px 30px rgba(0,0,0,0.08)",
        "card-hover": "0 18px 50px rgba(0,0,0,0.10)",
        nav:         "0 6px 18px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
