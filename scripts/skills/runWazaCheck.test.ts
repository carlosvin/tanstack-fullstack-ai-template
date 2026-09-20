import { describe, expect, it } from 'vitest'
import { assertWazaReady } from './runWazaCheck.mjs'

describe('assertWazaReady', () => {
	it('accepts a report where every skill is ready', () => {
		expect(
			assertWazaReady({
				skills: [
					{ name: 'one', ready: true },
					{ name: 'two', ready: true },
				],
			}),
		).toHaveLength(2)
	})

	it('fails when waza reports a skill as not ready', () => {
		expect(() =>
			assertWazaReady({
				skills: [
					{
						name: 'broken',
						ready: false,
						compliance: { issues: [{ message: 'Description is too long' }] },
						nextSteps: ['Add USE FOR'],
					},
				],
			}),
		).toThrow(/not ready/)
	})
})
