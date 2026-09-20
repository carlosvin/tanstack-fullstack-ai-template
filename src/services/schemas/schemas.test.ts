import { describe, expect, it } from 'vitest'
import { OptionalTaskPrioritySchema, OptionalTaskStatusSchema } from './schemas'

describe('optional closed-vocabulary schemas', () => {
	it('parses known statuses with Schema.parse and treats empty widget values as omitted', () => {
		expect(OptionalTaskStatusSchema.parse('done')).toBe('done')
		expect(OptionalTaskStatusSchema.parse(null)).toBeUndefined()
		expect(OptionalTaskStatusSchema.parse('')).toBeUndefined()
		expect(OptionalTaskStatusSchema.parse(undefined)).toBeUndefined()
	})

	it('rejects unknown statuses instead of silently widening', () => {
		expect(() => OptionalTaskStatusSchema.parse('nope')).toThrow()
	})

	it('parses known priorities with Schema.parse', () => {
		expect(OptionalTaskPrioritySchema.parse('critical')).toBe('critical')
		expect(OptionalTaskPrioritySchema.parse(undefined)).toBeUndefined()
		expect(() => OptionalTaskPrioritySchema.parse('urgent')).toThrow()
	})
})
