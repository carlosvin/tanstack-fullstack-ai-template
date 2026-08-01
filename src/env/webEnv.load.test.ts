import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('webEnv local file loading', () => {
	const originalCwd = process.cwd()

	afterEach(() => {
		process.chdir(originalCwd)
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it('loads GEMINI_API_KEY from .env before validating webServerEnv', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'webenv-'))
		writeFileSync(join(dir, '.env'), 'GEMINI_API_KEY=file-loaded-key\n', 'utf8')
		process.chdir(dir)

		const { webServerEnv } = await import('./webEnv')
		expect(webServerEnv.GEMINI_API_KEY).toBe('file-loaded-key')
	})
})
