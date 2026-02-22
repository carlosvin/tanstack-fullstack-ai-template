import { describe, expect, it } from 'vitest'
import { extractIdentityFromJwt } from './jwt'

function createTestJwt(payload: Record<string, unknown>): string {
	const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
	const body = btoa(JSON.stringify(payload))
	return `${header}.${body}.`
}

describe('extractIdentityFromJwt', () => {
	it('returns empty identity for null header', () => {
		const result = extractIdentityFromJwt(null)
		expect(result).toEqual({ email: '', name: '', groups: [] })
	})

	it('returns empty identity for empty string', () => {
		const result = extractIdentityFromJwt('')
		expect(result).toEqual({ email: '', name: '', groups: [] })
	})

	it('extracts email and name from a valid JWT', () => {
		const token = createTestJwt({ email: 'alice@example.com', name: 'Alice' })
		const result = extractIdentityFromJwt(token)
		expect(result.email).toBe('alice@example.com')
		expect(result.name).toBe('Alice')
	})

	it('handles Bearer prefix', () => {
		const token = createTestJwt({ email: 'bob@example.com', name: 'Bob' })
		const result = extractIdentityFromJwt(`Bearer ${token}`)
		expect(result.email).toBe('bob@example.com')
	})

	it('extracts groups array', () => {
		const token = createTestJwt({ email: 'a@b.com', groups: ['admin', 'users'] })
		const result = extractIdentityFromJwt(token)
		expect(result.groups).toEqual(['admin', 'users'])
	})

	it('returns empty groups when not present', () => {
		const token = createTestJwt({ email: 'a@b.com' })
		const result = extractIdentityFromJwt(token)
		expect(result.groups).toEqual([])
	})

	it('returns empty identity for invalid token', () => {
		const result = extractIdentityFromJwt('not-a-valid-token')
		expect(result).toEqual({ email: '', name: '', groups: [] })
	})
})
