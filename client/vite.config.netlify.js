import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteCommonjs()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@reown/appkit-utils': path.resolve(__dirname, '../node_modules/@reown/appkit-utils/dist/esm/exports/index.js'),
      'src': path.resolve(__dirname, './src'),
    },
  },
});
