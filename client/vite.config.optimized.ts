import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      // Optimize React runtime
      jsxRuntime: 'automatic',
      // Enable Fast Refresh
      fastRefresh: true,
    }),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Optimize HMR
    hmr: {
      overlay: true,
    },
  },
  
  define: {
    global: 'globalThis',
  },
  
  resolve: {
    alias: {
      buffer: 'buffer',
      // Add path aliases for cleaner imports
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@context': '/src/context',
      '@lib': '/src/lib',
      '@services': '/src/services',
      '@types': '/src/types',
    },
  },
  
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js',
      '@tanstack/react-query',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      target: 'es2020',
    },
  },
  
  build: {
    target: 'es2020',
    minify: 'esbuild', // Faster than terser
    sourcemap: false, // Disable in production for smaller bundle
    emptyOutDir: true,
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'solana-vendor': [
            '@solana/web3.js',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
          ],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['react-joyride'],
        },
        
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB
    
    // Reduce bundle size
    reportCompressedSize: true,
    cssCodeSplit: true,
  },
  
  // Performance optimizations
  esbuild: {
    // Remove console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
});

