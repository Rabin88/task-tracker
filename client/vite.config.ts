import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }, // matches CORS_ORIGIN in server/.env.example
  // MUI makes the single bundle ~600 kB (~190 kB gzipped), which is fine for this app.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/main.tsx'], // only wires providers together
      reporter: ['text', 'html'], // summary in the terminal, details in coverage/index.html
    },
  },
});
