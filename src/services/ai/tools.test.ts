import { describe, expect, it } from 'vitest'
import { NavigateInputSchema } from '@/services/ai/tools'
import { AppRuntimeInfoSchema } from '@/services/schemas/schemas'

describe('getAppRuntimeInfo tool shape', () => {
	it('allowlists only app identity and deployment ENV', () => {
		const info = AppRuntimeInfoSchema.parse({
			app: { name: 'TaskHub', version: '1.2.3' },
			ENV: 'production',
		})

		expect(info).toEqual({
			app: { name: 'TaskHub', version: '1.2.3' },
			ENV: 'production',
		})
		expect(info).not.toHaveProperty('SENTRY_DSN')
		expect(info).not.toHaveProperty('LOG_LEVEL')
	})
})

describe('navigate tool search', () => {
	it('keeps bulkStatus so the bulk toolbar target survives navigation', () => {
		const parsed = NavigateInputSchema.parse({
			to: '/tasks',
			search: { status: 'pending', bulkStatus: 'in-progress' },
		})

		expect(parsed.search).toMatchObject({ status: 'pending', bulkStatus: 'in-progress' })
	})
})
