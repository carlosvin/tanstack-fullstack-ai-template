import { describe, expect, it } from 'vitest'
import { createWriteTrace, resolveCreateLastModifiedBy, updateWriteTrace } from './traceability'

describe('traceability helpers', () => {
	it('createWriteTrace sets createdBy', () => {
		expect(createWriteTrace('alice@example.com')).toEqual({ createdBy: 'alice@example.com' })
	})

	it('updateWriteTrace sets lastModifiedBy', () => {
		expect(updateWriteTrace('bob@example.com')).toEqual({ lastModifiedBy: 'bob@example.com' })
	})

	it('resolveCreateLastModifiedBy prefers lastModifiedBy over createdBy', () => {
		expect(
			resolveCreateLastModifiedBy({
				createdBy: 'alice@example.com',
				lastModifiedBy: 'bob@example.com',
			}),
		).toBe('bob@example.com')
	})

	it('resolveCreateLastModifiedBy falls back to createdBy', () => {
		expect(resolveCreateLastModifiedBy({ createdBy: 'alice@example.com' })).toBe('alice@example.com')
	})
})
