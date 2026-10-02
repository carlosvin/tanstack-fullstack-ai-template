import { beforeEach, describe, expect, it, vi } from 'vitest'

const dispose = vi.fn(async () => {})
const openMongoRepositoryScope = vi.fn()

vi.mock('../../env/webEnv.server', () => ({
	webServerEnv: {
		REPOSITORY_TYPE: 'mongo',
		MONGODB_URI: 'mongodb://localhost/app',
		MONGODB_DB_NAME: 'app-db',
	},
}))

vi.mock('../db/mongoClient.server', () => ({
	openMongoRepositoryScope,
}))

describe('repositorySingleton', () => {
	beforeEach(async () => {
		vi.resetModules()
		dispose.mockClear()
		openMongoRepositoryScope.mockReset()
		const mod = await import('./repositorySingleton.server')
		mod.resetRepositorySingletonForTests()
	})

	it('awaits a pending open before disposing the Mongo client', async () => {
		let resolveOpen: ((value: unknown) => void) | undefined
		openMongoRepositoryScope.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveOpen = resolve
				}),
		)

		const { ensureRepository, closeRepositorySingleton } = await import('./repositorySingleton.server')
		const repoPromise = ensureRepository()
		const closePromise = closeRepositorySingleton()

		resolveOpen?.({
			repository: { kind: 'mongo' },
			[Symbol.asyncDispose]: dispose,
		})

		await expect(repoPromise).resolves.toEqual({ kind: 'mongo' })
		await closePromise
		expect(dispose).toHaveBeenCalledOnce()
	})

	it('leaves the seed singleton intact when closeRepositorySingleton runs', async () => {
		vi.resetModules()
		vi.doMock('../../env/webEnv.server', () => ({
			webServerEnv: { REPOSITORY_TYPE: 'seed' },
		}))

		const { ensureRepository, closeRepositorySingleton, resetRepositorySingletonForTests } = await import(
			'./repositorySingleton.server'
		)
		resetRepositorySingletonForTests()

		const first = await ensureRepository()
		await closeRepositorySingleton()
		const second = await ensureRepository()

		expect(first).toBe(second)
	})
})
