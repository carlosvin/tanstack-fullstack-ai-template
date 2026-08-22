import { afterEach, describe, expect, it, vi } from 'vitest'

const originalIsTTY = process.stdout.isTTY

afterEach(() => {
	process.stdout.isTTY = originalIsTTY
	vi.restoreAllMocks()
})

async function importFreshLogger() {
	vi.resetModules()
	return import('./logger')
}

describe('createModuleLogger', () => {
	it('binds module name and environment on the child logger', async () => {
		const { createModuleLogger } = await importFreshLogger()
		const log = createModuleLogger('myModule', { environment: 'staging' })
		expect(log.bindings()).toMatchObject({ name: 'myModule', environment: 'staging' })
	})

	it('defaults to info level', async () => {
		const { createModuleLogger } = await importFreshLogger()
		const log = createModuleLogger('defaults', { environment: 'development' })
		expect(log.isLevelEnabled('info')).toBe(true)
		expect(log.isLevelEnabled('debug')).toBe(false)
	})

	it('applies the per-module logLevel override', async () => {
		const { createModuleLogger } = await importFreshLogger()
		const log = createModuleLogger('warnOnly', { environment: 'development', logLevel: 'warn' })
		expect(log.isLevelEnabled('info')).toBe(false)
		expect(log.isLevelEnabled('warn')).toBe(true)
	})

	it('creates independent child loggers per module', async () => {
		const { createModuleLogger } = await importFreshLogger()
		const a = createModuleLogger('a', { environment: 'development' })
		const b = createModuleLogger('b', { environment: 'development' })
		expect(a).not.toBe(b)
		expect(a.bindings()).toMatchObject({ name: 'a' })
		expect(b.bindings()).toMatchObject({ name: 'b' })
	})

	it('logs without throwing on a TTY outside production', async () => {
		process.stdout.isTTY = true
		const { createModuleLogger } = await importFreshLogger()
		const log = createModuleLogger('ttyModule', { environment: 'staging' })
		expect(() => log.info('pretty tty log line')).not.toThrow()
	})

	// Regression: pino.transport() spawns a worker thread whose bundled ESM
	// code references __dirname, crashing Nitro server builds.
	it('never uses the worker-thread pino transport, even on a TTY', async () => {
		process.stdout.isTTY = true
		vi.resetModules()
		const { default: pino } = await import('pino')
		const transportSpy = vi.spyOn(pino, 'transport')
		const { createModuleLogger } = await import('./logger')

		createModuleLogger('ttyModule', { environment: 'staging' }).info('line')
		createModuleLogger('prodModule', { environment: 'production' }).info('line')

		expect(transportSpy).not.toHaveBeenCalled()
	})
})
