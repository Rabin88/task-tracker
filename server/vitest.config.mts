import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Tests get their own env so they never touch the dev or live database by accident.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/task_tracker_test',
      JWT_SECRET: 'test-secret-at-least-16-chars',
    },
  },
});
