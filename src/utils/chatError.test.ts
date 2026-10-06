import { describe, expect, it } from 'vitest'
import { friendlyChatError } from './chatError'

describe('friendlyChatError', () => {
	it('hides a provider 503 payload', () => {
		const error = new Error(
			'{"error":{"message":"{\\"error\\":{\\"code\\":503,\\"message\\":\\"This model is currently experiencing high demand.\\"}}"}}',
		)
		expect(friendlyChatError(error)).toBe('The model is busy right now. Wait a moment and try again.')
	})

	it('keeps a short application message', () => {
		expect(friendlyChatError(new Error('You need to log in.'))).toBe('You need to log in.')
	})
})
