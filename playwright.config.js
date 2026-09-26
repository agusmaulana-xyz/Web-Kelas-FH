import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3100', channel: 'chrome', headless: true, reducedMotion: 'reduce' },
  webServer: { command: 'npm run dev -- --mode test --port 3100 --strictPort', url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  reporter: 'list'
});
