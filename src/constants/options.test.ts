import { describe, expect, it } from 'vitest'
import { parseTaskPriority, parseTaskStatus } from './options'

describe('closed vocabularies', () => {
	it('parses known task statuses and rejects others', () => {
		expect(parseTaskStatus('done')).toBe('done')
		expect(parseTaskStatus('nope')).toBeUndefined()
		expect(parseTaskStatus(null)).toBeUndefined()
	})

	it('parses known task priorities and rejects others', () => {
		expect(parseTaskPriority('critical')).toBe('critical')
		expect(parseTaskPriority('urgent')).toBeUndefined()
		expect(parseTaskPriority(undefined)).toBeUndefined()
	})
})
