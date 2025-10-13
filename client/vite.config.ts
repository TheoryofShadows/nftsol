import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // accepts 0.0.0.0 / LAN
    port: 5173,
    strictPort: true
  }
});
