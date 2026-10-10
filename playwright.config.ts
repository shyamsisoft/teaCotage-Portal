import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: false,
    launchOptions: {
      slowMo: 800,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 800,
          args: ['--start-maximized'],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/admin/login',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
