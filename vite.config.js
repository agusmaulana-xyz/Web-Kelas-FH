import { defineConfig } from 'vite';
import { localDatabase } from './scripts/local-database.mjs';

export default defineConfig({
  plugins: [localDatabase()],
  server: { host: '127.0.0.1', port: 3000 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: { outDir: 'dist' }
});
