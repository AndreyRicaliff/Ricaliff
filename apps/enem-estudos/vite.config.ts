import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sql.js carrega o .wasm via fetch; o Vite serve a partir de node_modules com ?url
  optimizeDeps: { exclude: ['sql.js'] },
});
