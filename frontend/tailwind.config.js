/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind scans these files for class names (tree-shakes unused styles)
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom brand colors — use as: bg-brand, text-brand-dark, etc.
        brand: {
          DEFAULT: "#6C63FF",
          dark:    "#5A52D5",
          light:   "#E8E6FF",
        },
      },
    },
  },
  plugins: [],
};
