import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended, // rules of hooks, useEffect dependencies, etc.
      reactRefresh.configs.vite, // keeps hot reload working: component files only export components
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    // Test helpers export render functions and mocks, not components.
    files: ['tests/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier, // last: turns off rules that clash with Prettier's formatting
]);
