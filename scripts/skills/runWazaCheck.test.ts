import { describe, expect, it } from 'vitest'
import { assertWazaReady, requireWazaSuccess } from './runWazaCheck.mjs'

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

describe('requireWazaSuccess', () => {
	it('accepts a zero exit status', () => {
		expect(() => requireWazaSuccess({ status: 0, stdout: '{}' }, 'waza check')).not.toThrow()
	})

	it('fails on a non-zero exit even when stdout is present', () => {
		expect(() => requireWazaSuccess({ status: 2, stdout: '{"skills":[]}', stderr: 'not ready' }, 'waza check')).toThrow(
			/waza check failed \(exit 2\)/,
		)
	})
})
