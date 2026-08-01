/**
 * Server-side observability initialization.
 * Dev: `NODE_OPTIONS='--import tsx --import ./instrument.server.mts'`.
 * Production: emit via `tsc -p tsconfig.instrument.json` → `instrument.server.mjs`.
 */
import { resolveSentryBootstrapEnv } from './instrument.env.mts'
import { initSentry } from './instrument.shared.mts'
import pkg from './package.json' with { type: 'json' }

const { dsn, environment } = resolveSentryBootstrapEnv()
initSentry({ serverName: pkg.name, release: pkg.version, dsn, environment })
