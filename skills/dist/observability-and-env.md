# Observability and Environment Setup

- Project: `TanStack AI-Promptable Full-Stack Template`
- Project summary: A production-ready TanStack Start template designed to make internal tools AI promptable by default.
- Author: Carlos Martin-Sanchez (https://github.com/carlosvin)
- License: MIT
- Homepage: https://github.com/carlosvin/tanstack-fullstack-ai-template
- Repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
- Documentation: https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md
- Status: stable
- Supported tools: Windsurf [native, tested], Cursor [copy, tested], Claude Code [copy, tested]
- Capabilities: Centralized Zod env schemas with server/public split (src/env/), process.env read only once at module-level parse — no scattered env access, createModuleLogger(name, options) pino factory — no process.env inside, createServerLogger(name) bound factory — eliminates repeated env boilerplate, instrument.env.shared.mjs for a shared plain-ESM deployment env schema usable before TS loads, instrument.env.mjs for strict bootstrap env validation using the shared deployment env schema, instrument.shared.mjs for reusable initSentry — callers pre-resolve all values, instrument.server.mjs simplified to a short resolve + init entry using the shared helpers, Public env (ENV, LOG_LEVEL, SENTRY_DSN) reaches the browser via root loader only, No window.__ENV__ global
- ID: `observability-and-env`
- Version: `1.0.2`
- Tags: observability, logging, sentry, pino, environment, configuration, tanstack-start

## Summary

Use when adding structured logging (pino), centralized environment validation (Zod), or Sentry initialization to a TanStack Start app. Teaches the three-file bootstrap pattern (instrument.env.mjs → instrument.shared.mjs → instrument.server.mjs), the src/env/ schema split (server vs public), and the createModuleLogger / createServerLogger factory pattern that eliminates scattered process.env access from application code.

## Triggers

- add logging
- set up pino
- pino logger
- sentry init
- instrument server
- instrument.server.mjs
- env schema
- environment validation
- centralize observability
- createModuleLogger
- createServerLogger
- webEnv
- webServerEnv
- LOG_LEVEL
- SENTRY_DSN

## Canonical Content
# Observability and Environment Setup

**Purpose:** Establish a clean observability stack — validated env schemas,
structured pino logging, and centralized Sentry bootstrap — following the
patterns proven in production TanStack Start apps. Keeps `process.env` access
confined to two files; application code receives typed, validated values as
arguments.

## Key invariants (do not violate)

1. `process.env` is read **only** in `src/env/*.ts` (schema parse) and in a
   single `BootstrapEnvSchema.parse(process.env)` call inside
   `instrument.env.mjs` (Sentry bootstrap — before TS loads).
2. Logger options (`logLevel`, `environment`) are **passed as arguments** to
   `createModuleLogger` — the factory never reads `process.env`.
3. Public env reaches the browser via the **root loader only** — no
   `window.__ENV__` global.
4. The root pino logger is created **once** per process (lazy singleton); all
   module loggers are `child()` instances of it.

## File layout

```
src/env/
  runtimeEnvSchema.ts   # DeploymentEnv, LogLevel, shared preprocessors
  webEnv.ts             # WebServerEnvSchema + WebPublicEnvSchema; parsed once

src/utils/
  logger.ts             # createModuleLogger(name, { environment?, logLevel? })
  serverLogger.ts       # createServerLogger(name) — binds webServerEnv

src/middleware/
  webEnv.ts             # webEnvMiddleware: injects ctx.context.publicEnv

instrument.env.shared.mjs # shared DeploymentEnvSchema for bootstrap + TS callers
instrument.env.mjs      # resolveSentryBootstrapEnv() — plain ESM bootstrap resolver
instrument.shared.mjs   # initSentry({ dsn, environment, serverName, release })
instrument.server.mjs   # short entry: resolve + init
```

## src/env/runtimeEnvSchema.ts

Shared Zod enums and preprocessors used by web env (and any future pipeline env).

```typescript
import { z } from 'zod'
import { DEPLOYMENT_ENV_VALUES, DeploymentEnvSchema } from '../../instrument.env.shared.mjs'

/** Empty / whitespace-only strings → undefined (Node process.env values are strings). */
export function envStringToUndefined(val: unknown): unknown {
  if (val === undefined || val === null) return undefined
  const s = String(val).trim()
  return s === '' ? undefined : s
}

export { DEPLOYMENT_ENV_VALUES, DeploymentEnvSchema }
export type DeploymentEnv = (typeof DEPLOYMENT_ENV_VALUES)[number]

export const LOG_LEVEL_VALUES = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const
export const LogLevelSchema = z.enum(LOG_LEVEL_VALUES)
export type LogLevel = z.infer<typeof LogLevelSchema>

export const OptionalDeploymentEnvSchema = z.preprocess(envStringToUndefined, DeploymentEnvSchema.optional())
export const OptionalLogLevelSchema = z.preprocess(envStringToUndefined, LogLevelSchema.optional())
export const OptionalTrimmedStringSchema = z.preprocess(envStringToUndefined, z.string().optional())
```

## src/env/webEnv.ts

Parsed once when first imported. `WebPublicEnvSchema` is the browser-safe
slice — only non-secret fields. `WebServerEnvSchema` adds secrets.

```typescript
import { z } from 'zod'
import {
  OptionalDeploymentEnvSchema,
  OptionalLogLevelSchema,
  OptionalTrimmedStringSchema,
} from './runtimeEnvSchema'

export const WebPublicEnvSchema = z.object({
  ENV: OptionalDeploymentEnvSchema.describe('Deployment name: development, staging, or production.'),
  LOG_LEVEL: OptionalLogLevelSchema.describe('Minimum pino log level.'),
  SENTRY_DSN: OptionalTrimmedStringSchema.describe('Sentry DSN for both server and browser.'),
})
export type WebPublicEnv = z.infer<typeof WebPublicEnvSchema>

export const WebServerEnvSchema = WebPublicEnvSchema.extend({
  // ... app-specific required/optional vars
  AUTH_HEADER_NAME: z.string().optional(),
})
export type WebServerEnv = z.infer<typeof WebServerEnvSchema>

export const webServerEnv: WebServerEnv = WebServerEnvSchema.parse(process.env)

export const webPublicEnv: WebPublicEnv = WebPublicEnvSchema.parse({
  ...webServerEnv,
})
```

**Add required secrets** (API keys, DB URIs) to `WebServerEnvSchema` only —
they must never appear in `WebPublicEnvSchema`.

## src/utils/logger.ts

Pino factory. No `process.env` access — env values come from the caller.

```typescript
import pino, { type Logger } from 'pino'
import type { DeploymentEnv, LogLevel } from '../env/runtimeEnvSchema'

export type ModuleLoggerOptions = {
  environment?: DeploymentEnv  // validated by caller's env schema
  logLevel?: LogLevel          // validated by caller's env schema
}

let rootLogger: Logger | null = null

function getRootLogger(environment?: DeploymentEnv): Logger {
  if (rootLogger) return rootLogger
  // Safe for browser bundles: process.stdout may be undefined
  const isNodeTty = typeof process !== 'undefined' && process.stdout != null && Boolean(process.stdout.isTTY)
  const useTtyPretty = isNodeTty && environment !== 'production'
  // Root at 'trace' so child level overrides are never filtered out
  rootLogger = useTtyPretty
    ? pino({ level: 'trace' }, pino.transport({
        target: 'pino-pretty',
        options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss.l' },
      }))
    : pino({ level: 'trace' })
  return rootLogger
}

export function createModuleLogger(name: string, options: ModuleLoggerOptions): Logger {
  const { environment } = options
  const bindings = environment ? { name, environment } : { name }
  return getRootLogger(environment).child(bindings, { level: options.logLevel ?? 'info' })
}
```

## src/utils/serverLogger.ts

Thin bound factory for server-side modules — eliminates repeated
`{ environment: webServerEnv.ENV, logLevel: webServerEnv.LOG_LEVEL }` boilerplate.

```typescript
import { webServerEnv } from '../env/webEnv'
import { createModuleLogger } from './logger'

/** Server-side logger factory pre-bound to webServerEnv options. */
export const createServerLogger = (name: string) =>
  createModuleLogger(name, { environment: webServerEnv.ENV, logLevel: webServerEnv.LOG_LEVEL })
```

Usage in any server module:
```typescript
import { createServerLogger } from '../utils/serverLogger'
const log = createServerLogger('myServerFn')
```

## instrument.env.mjs

Plain ESM — no TS — so it loads from the `--import` hook before any
transpilation. Bootstrap env is still validated in one place instead of
branching on raw `process.env` values, but the deployment enum itself is
imported from `instrument.env.shared.mjs` so bootstrap and TypeScript callers
share the same allowed values. Keep this strict: invalid `NODE_ENV` values
should fail at `BootstrapEnvSchema.parse(process.env)`, and Sentry should be
configured only through `SENTRY_DSN`.

```javascript
import { z } from 'zod'
import { DeploymentEnvSchema } from './instrument.env.shared.mjs'

const BootstrapEnvSchema = z.object({
  NODE_ENV: DeploymentEnvSchema.optional(),
  SENTRY_DSN: z.string().optional(),
})

export function resolveSentryBootstrapEnv() {
  const env = BootstrapEnvSchema.parse(process.env)
  return {
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV ?? 'development',
  }
}
```

## instrument.shared.mjs

Receives all values pre-resolved — no `process.env` reads inside.

```javascript
import * as Sentry from '@sentry/tanstackstart-react'

/**
 * @typedef {object} InitSentryOptions
 * @property {string}           serverName  - Human-readable server name.
 * @property {string|undefined} dsn         - Sentry DSN. No-op when falsy.
 * @property {'development'|'staging'|'production'} environment
 * @property {string}           [release]   - Optional release identifier.
 */

/** Initialize Sentry. No-op when no DSN is set. */
export function initSentry({ serverName, dsn, environment, release }) {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment,
    serverName,
    ...(release ? { release } : {}),
    sendDefaultPii: true,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  })
}
```

## instrument.server.mjs (simplified entry)

```javascript
import { resolveSentryBootstrapEnv } from './instrument.env.mjs'
import { initSentry } from './instrument.shared.mjs'
import pkg from './package.json' with { type: 'json' }

const { dsn, environment } = resolveSentryBootstrapEnv()
initSentry({ serverName: 'my-app', release: pkg.version, dsn, environment })
```

Update the `build` script to copy all instrument files:
```json
"build": "vite build && cp instrument.*.mjs .output/server"
```

## webEnvMiddleware

Injects `ctx.context.publicEnv` for server functions; the root loader exposes
it so React components can read `ENV`/`LOG_LEVEL`/`SENTRY_DSN` without a
`window.__ENV__` global.

```typescript
// src/middleware/webEnv.ts
import { createMiddleware } from '@tanstack/react-start'
import { webPublicEnv } from '../env/webEnv'

export const webEnvMiddleware = createMiddleware().server(({ next }) =>
  next({ context: { publicEnv: webPublicEnv } })
)
```

Register in `src/start.ts`:
```typescript
import { webEnvMiddleware } from './middleware/webEnv'
// add to requestMiddleware array
```

In the root loader, expose it to the client:
```typescript
loader: async () => {
  // ...existing loader data...
  return { publicEnv: webPublicEnv }
}
```

## Updating call sites

**observability/index.ts** — replace `process.env.SENTRY_DSN` with the
validated value from `webPublicEnv`:

```typescript
import { webPublicEnv } from '../../env/webEnv'

export function getObservability(): ObservabilityService {
  if (!instance) {
    instance = webPublicEnv.SENTRY_DSN
      ? new SentryObservability()
      : new NoopObservability()
  }
  return instance
}
```

**middleware/auth.ts** — replace `process.env.AUTH_HEADER_NAME` with
`webServerEnv`:

```typescript
import { webServerEnv } from '../env/webEnv'
const AUTH_HEADER_NAME = webServerEnv.AUTH_HEADER_NAME ?? 'Authorization'
```

## Checklist

- [ ] `process.env` appears only in `src/env/*.ts` and one bootstrap schema parse in `instrument.env.mjs`
- [ ] `createModuleLogger` / `createServerLogger` never call `process.env`
- [ ] `instrument.server.mjs` uses `resolveSentryBootstrapEnv()` + `initSentry()`
- [ ] `build` script copies `instrument.*.mjs` (not just `instrument.server.mjs`)
- [ ] Public env exposed through root loader (not `window.__ENV__`)
- [ ] `SENTRY_DSN` / `LOG_LEVEL` / `ENV` documented in `.env.example`
