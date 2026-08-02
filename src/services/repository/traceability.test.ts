import { describe, expect, it } from 'vitest'
import { createWriteTrace, updateWriteTrace } from './traceability'

describe('traceability helpers', () => {
	it('createWriteTrace sets createdBy', () => {
		expect(createWriteTrace('alice@example.com')).toEqual({ createdBy: 'alice@example.com' })
	})

	it('updateWriteTrace sets lastModifiedBy', () => {
		expect(updateWriteTrace('bob@example.com')).toEqual({ lastModifiedBy: 'bob@example.com' })
	})
})
