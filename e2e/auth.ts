import { type BrowserContext, test as base, type Page } from '@playwright/test'

interface UserClaims {
	email: string
	name: string
	groups?: string[]
}

/**
 * Creates an unsigned JWT (alg: "none") that jose.decodeJwt() will parse.
 * No signature verification happens in this app, so this is sufficient for E2E tests.
 */
function createUnsignedJwt(claims: UserClaims): string {
	const header = { alg: 'none', typ: 'JWT' }
	const payload = { ...claims, groups: claims.groups ?? [] }

	const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url')

	return `${encode(header)}.${encode(payload)}.`
}

export const ALICE = {
	email: 'alice@example.com',
	name: 'Alice Johnson',
	groups: [],
} satisfies UserClaims

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
		await use(page)
	},
})

export { expect } from '@playwright/test'
