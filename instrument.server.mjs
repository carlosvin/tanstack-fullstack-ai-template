/**
 * Server-side observability initialization.
 * Loaded via NODE_OPTIONS='--import ./instrument.server.mjs' before the app starts.
 */
import { resolveSentryBootstrapEnv } from './instrument.env.mjs'
import { initSentry } from './instrument.shared.mjs'
import pkg from './package.json' with { type: 'json' }

const { dsn, environment } = resolveSentryBootstrapEnv()
initSentry({ serverName: pkg.name, release: pkg.version, dsn, environment })
