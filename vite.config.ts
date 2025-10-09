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
    include: ['buffer'],
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          'vendor-react': ['react', 'react-dom', 'wouter'],
          
          // Solana and Web3
          'vendor-solana': [
            '@solana/web3.js',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
            '@solana/spl-token',
          ],
          
          // Radix UI components (split into smaller chunks)
          'vendor-radix-dialog': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
          ],
          'vendor-radix-dropdown': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-menubar',
          ],
          'vendor-radix-form': [
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
          ],
          'vendor-radix-layout': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-separator',
          ],
          'vendor-radix-misc': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
            '@radix-ui/react-hover-card',
          ],
          
          // Forms and validation
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
            'zod-validation-error',
          ],
          
          // Data fetching and state
          'vendor-query': ['@tanstack/react-query'],
          
          // UI utilities
          'vendor-ui-utils': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'cmdk',
            'lucide-react',
          ],
          
          // Charts and visualization
          'vendor-charts': ['recharts'],
          
          // Other utilities
          'vendor-utils': [
            'date-fns',
            'axios',
            'react-dropzone',
            'react-error-boundary',
          ],
        },
        // Ensure consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit but still warn for large chunks
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: true,
    },
  },
});

