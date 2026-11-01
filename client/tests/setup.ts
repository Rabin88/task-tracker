import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// MUI renders more slowly in jsdom than plain HTML, so give findBy* queries longer than the 1s default.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals(); // undo each test's mocked fetch
  vi.restoreAllMocks();
});
