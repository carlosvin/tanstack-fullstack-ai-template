import { type BrowserContext, test as base, type Page } from '@playwright/test'
import type { UserIdentity } from '../src/types'
import { createUnsignedJwt } from '../src/utils/jwt.server'

export const ALICE = {
	email: 'alice@example.com',
	name: 'Alice Johnson',
	groups: [],
} satisfies UserIdentity

export const ALICE_JWT = createUnsignedJwt(ALICE)

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
		await page.addInitScript(() => {
			window.confirm = () => true
		})
		await use(page)
	},
})

export { expect } from '@playwright/test'
