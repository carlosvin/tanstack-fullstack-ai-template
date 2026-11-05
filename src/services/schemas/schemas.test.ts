import { describe, expect, it } from 'vitest'
import { CalendarDateSchema, OptionalTaskPrioritySchema, OptionalTaskStatusSchema } from '@/services/schemas/schemas'

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

	it('accepts a real calendar date and rejects a rolled-over one', () => {
		expect(CalendarDateSchema.parse('2026-10-17')).toBe('2026-10-17')
		expect(CalendarDateSchema.parse('2024-02-29')).toBe('2024-02-29')
		expect(() => CalendarDateSchema.parse('2026-13-40')).toThrow()
		expect(() => CalendarDateSchema.parse('2026-02-31')).toThrow()
		expect(() => CalendarDateSchema.parse('2025-02-29')).toThrow()
	})

	it('parses known priorities with Schema.parse', () => {
		expect(OptionalTaskPrioritySchema.parse('critical')).toBe('critical')
		expect(OptionalTaskPrioritySchema.parse(undefined)).toBeUndefined()
		expect(() => OptionalTaskPrioritySchema.parse('urgent')).toThrow()
	})
})
