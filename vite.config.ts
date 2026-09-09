import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/react-movie-finder/',
  plugins: [
    react(),
    tsconfigPaths(),
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
