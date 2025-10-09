import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, 'client');
const distDir = path.resolve(__dirname, 'dist/public');

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      buffer: 'buffer',
    },
  },
  esbuild: {
    // Strip debug statements in production builds to reduce bundle size
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Create focused vendor chunks for faster initial load
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-solana': [
            '@solana/web3.js',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
          ],
          'vendor-charts': ['recharts'],
          'vendor-carousel': ['embla-carousel-react'],
          'vendor-buffer': ['buffer'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
    // Provide a minimal process.env to avoid runtime errors in dependencies
    'process.env': {},
  },
});

