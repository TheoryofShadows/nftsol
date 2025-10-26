import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'NFTSol - Revolutionary NFT Platform',
        short_name: 'NFTSol',
        description: 'The Most Revolutionary NFT Platform on Solana with CLOUT Token Rewards',
        theme_color: '#9945FF',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.pinata\.cloud\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ipfs-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,        // accepts 0.0.0.0 / LAN
    port: 5173,
    strictPort: true
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? process.env.VITE_API_BASE || 'https://nftsol.onrender.com'
        : process.env.VITE_API_BASE || 'http://localhost:3000'
    ),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          solana: ['@solana/web3.js', '@solana/spl-token', '@metaplex-foundation/mpl-token-metadata'],
          wallet: ['@solana/wallet-adapter-base', '@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
          animations: ['framer-motion'],
          query: ['@tanstack/react-query'],
          utils: ['react-intersection-observer', 'react-responsive']
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    modulePreload: {
      polyfill: false
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/web3.js',
      '@solana/spl-token',
      'framer-motion',
      '@tanstack/react-query',
      'react-intersection-observer',
      'react-responsive',
      'socket.io-client'
    ],
    exclude: ['@vite/client', '@vite/env']
  }
});
