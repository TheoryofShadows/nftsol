import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@services': path.resolve(__dirname, './src/services'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js',
      '@tanstack/react-query',
      'buffer',
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
    minify: 'esbuild',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Use a resolver function rather than a static map: the bare-specifier
        // form ('react', 'react-dom') produced an EMPTY react-vendor chunk
        // because the app actually imports react/jsx-runtime and react-dom/client.
        // Matching on the resolved module path captures those sub-paths too.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('@solana/')) return 'solana-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          return undefined;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
    cssCodeSplit: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
});
