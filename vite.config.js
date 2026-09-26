import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build' && (process.env.VITE_USE_FIREBASE_EMULATORS || env.VITE_USE_FIREBASE_EMULATORS) === 'true') {
    throw new Error('Nonaktifkan VITE_USE_FIREBASE_EMULATORS sebelum build produksi.');
  }
  return {
  server: { host: '127.0.0.1', port: 3000 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: { outDir: 'dist' }
  };
});
