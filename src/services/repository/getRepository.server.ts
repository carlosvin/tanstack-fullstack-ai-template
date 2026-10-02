import { createServerOnlyFn } from '@tanstack/react-start'
import { closeRepositorySingleton, ensureRepository as ensureRepositorySingleton } from './repositorySingleton.server'

/** Composition root. Constructs the repository once; inject the result via middleware. */
export const ensureRepository = createServerOnlyFn(ensureRepositorySingleton)

/** Closes the owned Mongo client. Seed mode is a no-op. */
export const closeRepository = createServerOnlyFn(closeRepositorySingleton)
