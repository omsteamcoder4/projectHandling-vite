import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    historyApiFallback: true,
    watch: {
      usePolling: true, // Ensures file changes are detected properly
    },
    hmr: {
      overlay: false, // Prevents Vite from showing full-screen error overlays
    },
  },
});


