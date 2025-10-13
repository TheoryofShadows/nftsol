import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from '@vitejs/plugin-commonjs';
import path from 'path';

export default defineConfig({
  plugins: [react(), commonjs()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@reown/appkit-utils': '/home/khk89/NFTSol/node_modules/@reown/appkit-utils/dist/esm/exports/index.js',
      'src': path.resolve(__dirname, './src'),
    },
  },
});
