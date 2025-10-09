import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, 'client');
const distDir = path.resolve(__dirname, 'dist/public');

export default defineConfig({
  root: rootDir,
  plugins: [
    react({
      // Enable React 18 features
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    })
  ],
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
      '@solana/wallet-adapter-react-ui',
      '@tanstack/react-query',
      'lucide-react',
      'wouter'
    ],
    exclude: ['@keystonehq/sdk'] // Exclude problematic wallet SDK
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'solana-vendor': ['@solana/web3.js', '@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['@tanstack/react-query', 'wouter', 'clsx', 'tailwind-merge'],
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development'
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    // Enable HMR
    hmr: {
      overlay: true
    }
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});