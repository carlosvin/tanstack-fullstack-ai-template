import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureAgenticBrowserContext, captureBrowserContext } from '@/utils/browserContext'

describe('browserContext capture', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('captures route location for side and prompt-first shells', () => {
		vi.stubGlobal('navigator', { language: 'en-US' })
		vi.stubGlobal('window', {
			location: {
				pathname: '/tasks/abc',
				search: '?status=done',
				href: 'https://app.local/tasks/abc?status=done',
			},
		})

		const ctx = captureBrowserContext()
		expect(ctx.timezone).toBeTruthy()
		expect(ctx.locale).toBe('en-US')
		expect(ctx.currentPathname).toBe('/tasks/abc')
		expect(ctx.currentSearch).toBe('?status=done')
		expect(ctx.currentHref).toBe('https://app.local/tasks/abc?status=done')
		expect(ctx.surface).toBeUndefined()
	})

	it('marks the agentic shell and omits location fields', () => {
		vi.stubGlobal('navigator', { language: 'en-GB' })

		const ctx = captureAgenticBrowserContext()
		expect(ctx.locale).toBe('en-GB')
		expect(ctx.surface).toBe('agentic')
		expect(ctx.currentPathname).toBeUndefined()
		expect(ctx.currentSearch).toBeUndefined()
		expect(ctx.currentHref).toBeUndefined()
	})
})
