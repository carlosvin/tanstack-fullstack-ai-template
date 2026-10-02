import { createServerOnlyFn } from '@tanstack/react-start'
import { closeRepositorySingleton, getRepositorySingleton } from './repositorySingleton.server'

/** Returns the singleton repository. Connects and initializes Mongo when selected. */
export const getRepository = createServerOnlyFn(getRepositorySingleton)

/** Closes the owned Mongo client. Seed mode is a no-op. */
export const closeRepository = createServerOnlyFn(closeRepositorySingleton)
