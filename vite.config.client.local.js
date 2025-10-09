import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "client",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/spl-token'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js', 'react', 'react-dom'],
    exclude: ['@keystonehq/sdk']
  },
  // Performance optimizations
  esbuild: {
    target: 'es2020',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  }
});
