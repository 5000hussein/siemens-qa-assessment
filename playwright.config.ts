import { defineConfig, devices } from '@playwright/test';
import { authStatePath, baseUrl, isCI } from './src/config/environment';

export default defineConfig({
  testDir: './src/tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Every test creates and cleans up its own booking, but all share one account and the sandbox's few events,
  // so seat-count assertions would race in parallel. One worker until each worker gets its own account.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  // In CI the github reporter also writes every failure as an annotation on the run page
  reporter: isCI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Visible browser locally so you can watch the run; headless in CI. HEADLESS=true forces headless locally.
    headless: isCI || process.env.HEADLESS === 'true',
    launchOptions: { slowMo: isCI ? 0 : Number(process.env.SLOW_MO || 0) },
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/*.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui',
      testMatch: '**/ui/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: authStatePath },
    },
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
    },
  ],
});
