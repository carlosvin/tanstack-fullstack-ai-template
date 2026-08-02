import { describe, expect, it } from 'vitest'
import { AppRuntimeInfoSchema } from '../schemas/schemas'

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
