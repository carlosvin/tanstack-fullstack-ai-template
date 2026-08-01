import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { AppMetaSchema, appMeta } from './appMeta'

describe('appMeta', () => {
	it('parses name and version from package.json once', () => {
		expect(appMeta).toEqual({ name: pkg.name, version: pkg.version })
		expect(AppMetaSchema.parse(appMeta)).toEqual(appMeta)
	})
})
