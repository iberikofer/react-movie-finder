import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/react-movie-finder/',
  resolve: {
    alias: {
      fetch: path.resolve(__dirname, 'src/fetch.ts'),
      components: path.resolve(__dirname, 'src/components'),
      context: path.resolve(__dirname, 'src/context'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      pages: path.resolve(__dirname, 'src/pages'),
      translations: path.resolve(__dirname, 'src/translations'),
      types: path.resolve(__dirname, 'src/types'),
      utils: path.resolve(__dirname, 'src/utils'),
    },
  },
  plugins: [
    react(),
    tsconfigPaths({ root: __dirname }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        injectionPoint: undefined, // Create React App uses workbox-precaching injectManifest manually in the file via self.__WB_MANIFEST, so we should let VitePWA handle the injection or pass 'self.__WB_MANIFEST'. Actually, VitePWA defaults to 'self.__WB_MANIFEST'.
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
