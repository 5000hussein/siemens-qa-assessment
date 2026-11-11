import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules/', 'dist/', 'playwright-report/', 'test-results/', '.auth/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-page-pause': 'error',
    },
  },
  {
    files: ['src/pages/**/*.ts'],
    plugins: { playwright },
    rules: {
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-page-pause': 'error',
    },
  },
  prettier
);
