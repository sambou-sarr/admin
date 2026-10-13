import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En dev, /api est redirigé vers l'API Express : le navigateur ne voit qu'une seule origine (pas de CORS).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } } },
});
