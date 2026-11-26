import { type BrowserContext, test as base, type Page } from '@playwright/test'
import type { UserIdentity } from '@/services/schemas/schemas'
import { createHs256Jwt } from '@/utils/jwt.server'

/** Must match playwright.config.ts `webServer.env.AUTH_JWT_SECRET` (and any reused server). */
export const E2E_AUTH_JWT_SECRET = 'e2e-test-secret-at-least-32-bytes!!'

export const ALICE = {
	email: 'alice@example.com',
	name: 'Alice Johnson',
	groups: [],
} satisfies UserIdentity

export const ALICE_JWT = await createHs256Jwt(ALICE, E2E_AUTH_JWT_SECRET)

interface AuthFixtures {
	authedContext: BrowserContext
	authedPage: Page
}

export const test = base.extend<AuthFixtures>({
	authedContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			extraHTTPHeaders: { Authorization: `Bearer ${ALICE_JWT}` },
		})
		await use(context)
		await context.close()
	},
	authedPage: async ({ authedContext }, use) => {
		const page = await authedContext.newPage()
		await use(page)
	},
})

export { expect } from '@playwright/test'
