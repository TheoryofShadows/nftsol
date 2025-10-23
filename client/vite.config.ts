import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // accepts 0.0.0.0 / LAN
    port: 5173,
    strictPort: true
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'https://nftsol-server-prod.onrender.com')
  }
});
