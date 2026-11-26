import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		screenshot: 'only-on-failure',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'REPOSITORY_TYPE=seed pnpm dev',
		url: 'http://localhost:3000',
		reuseExistingServer: true,
		timeout: 30_000,
		env: {
			NODE_ENV: 'development',
			OPENAI_API_KEY: 'sk-e2e-placeholder',
			// Must match e2e/auth.ts E2E_AUTH_JWT_SECRET so Alice fixtures verify even when
			// reuseExistingServer reuses a process that was started with the same secret.
			AUTH_JWT_SECRET: 'e2e-test-secret-at-least-32-bytes!!',
		},
	},
})
