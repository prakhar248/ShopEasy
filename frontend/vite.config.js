// vite.config.js
// Vite is the build tool we use instead of Create React App (faster)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Frontend runs on port 3000
    // Proxy API calls to backend — avoids CORS issues in development
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
