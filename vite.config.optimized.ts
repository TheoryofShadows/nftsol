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
  optimizeDeps: {
    include: [
      'buffer',
      'react',
      'react-dom',
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@tanstack/react-query'
    ],
    exclude: [
      // Exclude heavy dependencies that should be loaded on demand
      '@coral-xyz/anchor'
    ]
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: ['react', 'react-dom'],
          // Solana chunk for blockchain-related code
          solana: ['@solana/web3.js', '@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
          // UI chunk for component library
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Enable source maps for debugging
    sourcemap: true,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  server: {
    // Optimize dev server
    hmr: {
      overlay: false
    },
    // Enable compression
    compress: true
  }
});