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
- Capabilities: Centralized Zod env schemas with server/public split (src/env/), process.env read only once at module-level parse — no scattered env access, createModuleLogger(name, options) pino factory — no process.env inside, createServerLogger(name) bound factory — eliminates repeated env boilerplate, instrument.env.shared.mts for a shared deployment env schema (bootstrap + TS callers), instrument.env.mts for strict bootstrap env validation using the shared deployment env schema, instrument.shared.mts for reusable initSentry — callers pre-resolve all values, instrument.server.mts as the dev --import entry; tsc emits instrument.*.mjs to .output/server for production, Public env + app meta for the browser: route loaders call getBrowserShellSession (toBrowserShellSession projection) — never import webEnv in client-shared modules, Typed request context: webEnvMiddleware injects serverEnv, publicEnv, appMeta; Register.requestContext enforces types, No window.__ENV__ global
- ID: `observability-and-env`
- Version: `1.1.0`
- Tags: observability, logging, sentry, pino, environment, configuration, tanstack-start

## Summary

Use when adding structured logging (pino), centralized environment validation (Zod), or Sentry initialization to a TanStack Start app. Teaches the three-file bootstrap pattern (instrument.env.mts → instrument.shared.mts → instrument.server.mts; emitted as .mjs for production), the src/env/ schema split (server vs public), and the createModuleLogger / createServerLogger factory pattern that eliminates scattered process.env access from application code.

## Triggers

- add logging
- set up pino
- pino logger
- sentry init
- instrument server
- instrument.server.mts
- instrument.server.mjs
- env schema
- environment validation
- centralize observability
- createModuleLogger
- createServerLogger
- webEnv
- webServerEnv
- appMeta
- browserShellSession
- getBrowserShellSession
- toBrowserShellSession
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
   `instrument.env.mts` (Sentry bootstrap — runs before the app entry).
   Parsed values are module singletons — **once per process at startup**.
2. Logger options (`logLevel`, `environment`) are **passed as arguments** to
   `createModuleLogger` — the factory never reads `process.env`.
3. **Typed server context** — global middleware injects `serverEnv`,
   `publicEnv`, and `appMeta` onto `ctx.context`; `Register.server.requestContext`
   makes those fields type-safe in handlers (direct `context.*` access).
4. **Browser shell session** — no `window.__ENV__`; root loader calls
   `getBrowserShellSession()` which returns `toBrowserShellSession(...)`
   (public env + app name/version). Never return `serverEnv` to the client.
   Do not import `webEnv` from client-shared route files.
5. The root pino logger is created **once** per process (lazy singleton); all
   module loggers are `child()` instances of it.

## File layout

```
src/env/
  runtimeEnvSchema.ts      # DeploymentEnv, LogLevel, shared preprocessors
  webEnv.ts                # WebServerEnvSchema + WebPublicEnvSchema; parsed once
  appMeta.ts               # AppMetaSchema from package.json; parsed once
  browserShellSession.ts   # BrowserShellSessionSchema + toBrowserShellSession

src/register-request-context.ts  # Register.server.requestContext typing

src/utils/
  logger.ts             # createModuleLogger(name, { environment, logLevel? })
  serverLogger.ts       # createServerLogger(name) — binds webServerEnv

src/middleware/
  webEnv.ts             # webEnvMiddleware: injects serverEnv, publicEnv, appMeta

instrument.env.shared.mts # shared DeploymentEnvSchema for bootstrap + TS callers
instrument.env.mts      # resolveSentryBootstrapEnv()
instrument.shared.mts   # initSentry({ dsn, environment, serverName, release })
instrument.server.mts   # bootstrap entry: resolve + init (dev); emitted .mjs in .output/server for prod
tsconfig.instrument.json
```

## src/env/runtimeEnvSchema.ts

Shared Zod enums and preprocessors used by web env (and any future pipeline env).

```typescript
import { z } from 'zod'
import { DEPLOYMENT_ENV_VALUES, type DeploymentEnv, DeploymentEnvSchema } from '../../instrument.env.shared.mjs'

/** Empty / whitespace-only strings → undefined (Node process.env values are strings). */
export function envStringToUndefined(val: unknown): unknown {
  if (val === undefined || val === null) return undefined
  const s = String(val).trim()
  return s === '' ? undefined : s
}

export type { DeploymentEnv }
export { DEPLOYMENT_ENV_VALUES, DeploymentEnvSchema }

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

export const webPublicEnv: WebPublicEnv = {
  ENV: webServerEnv.ENV,
  LOG_LEVEL: webServerEnv.LOG_LEVEL,
  SENTRY_DSN: webServerEnv.SENTRY_DSN,
}
```

**Add required secrets** (API keys, DB URIs) to `WebServerEnvSchema` only —
they must never appear in `WebPublicEnvSchema`.

## src/utils/logger.ts

Pino factory. No `process.env` access — env values come from the caller.

```typescript
import pino, { type Logger } from 'pino'
import type { DeploymentEnv, LogLevel } from '../env/runtimeEnvSchema'

export type ModuleLoggerOptions = {
  environment: DeploymentEnv   // validated by caller's env schema
  logLevel?: LogLevel          // validated by caller's env schema
}

let rootLogger: Logger | null = null

function getRootLogger(environment: DeploymentEnv): Logger {
  if (rootLogger) return rootLogger
  // Server-only — not safe for client bundles.
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
  return getRootLogger(environment).child({ name, environment }, { level: options.logLevel ?? 'info' })
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
  createModuleLogger(name, { environment: webServerEnv.ENV ?? 'development', logLevel: webServerEnv.LOG_LEVEL })
```

Usage in any server module:
```typescript
import { createServerLogger } from '../utils/serverLogger'
const log = createServerLogger('myServerFn')
```

## instrument.env.mts

TypeScript bootstrap module compiled to ESM for production. In dev, preload
`tsx` and import `instrument.server.mts` directly. Use `.mjs` extensions on
**relative imports between instrument files** so `moduleResolution: NodeNext`
maps to the emitted `.mjs` output. Bootstrap env stays validated in one place;
deployment enum is imported from `./instrument.env.shared.mjs` (source is
`.mts`). Keep strict: invalid `NODE_ENV` values fail at
`BootstrapEnvSchema.parse(process.env)`, and Sentry uses only `SENTRY_DSN`.

```typescript
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

## instrument.shared.mts

Receives all values pre-resolved — no `process.env` reads inside.

```typescript
import * as Sentry from '@sentry/tanstackstart-react'

export type InitSentryOptions = {
  serverName: string
  dsn: string | undefined
  environment: 'development' | 'staging' | 'production'
  release?: string
}

export function initSentry({ serverName, dsn, environment, release }: InitSentryOptions): void {
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

## instrument.server.mts (bootstrap entry)

```typescript
import { resolveSentryBootstrapEnv } from './instrument.env.mjs'
import { initSentry } from './instrument.shared.mjs'
import pkg from './package.json' with { type: 'json' }

const { dsn, environment } = resolveSentryBootstrapEnv()
initSentry({ serverName: 'my-app', release: pkg.version, dsn, environment })
```

**Dev** — preload `tsx` then this file, e.g. `NODE_OPTIONS='--import tsx --import ./instrument.server.mts'`.

**Production** — `tsc -p tsconfig.instrument.json` emits `.mjs` beside the Vite server bundle; copy `package.json` into `.output/server` so the import above resolves.

Update the `build` script:
```json
"build": "vite build && tsc -p tsconfig.instrument.json && cp package.json .output/server/package.json"
```

## src/env/appMeta.ts

Application identity from `package.json`, validated once at module load.

```typescript
import { z } from 'zod'
import pkg from '../../package.json' with { type: 'json' }

export const AppMetaSchema = z.object({
  name: z.string().min(1).describe('Application name from package.json'),
  version: z.string().min(1).describe('Application version from package.json'),
})
export type AppMeta = z.infer<typeof AppMetaSchema>

export const appMeta: AppMeta = AppMetaSchema.parse({
  name: pkg.name,
  version: pkg.version,
})
```

## src/env/browserShellSession.ts

Allowlisted browser projection — public env + app meta only.

```typescript
export const BrowserShellSessionSchema = z.object({
  publicEnv: WebPublicEnvSchema,
  app: AppMetaSchema,
})
export type BrowserShellSession = z.infer<typeof BrowserShellSessionSchema>

export function toBrowserShellSession(input: {
  publicEnv: WebPublicEnv
  appMeta: AppMeta
}): BrowserShellSession {
  return BrowserShellSessionSchema.parse({
    publicEnv: input.publicEnv,
    app: input.appMeta,
  })
}
```

## webEnvMiddleware + Register

Injects startup-validated `serverEnv`, `publicEnv`, and `appMeta` for server
functions. Type the full request context via module augmentation.

```typescript
// src/middleware/webEnv.ts
import { createMiddleware } from '@tanstack/react-start'
import { appMeta } from '../env/appMeta'
import { webPublicEnv, webServerEnv } from '../env/webEnv'
import { authMiddleware } from './auth'

export const webEnvMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(({ next }) =>
    next({
      context: {
        serverEnv: webServerEnv,
        publicEnv: webPublicEnv,
        appMeta,
      },
    }),
  )
```

```typescript
// src/register-request-context.ts
import type { AppMeta } from './env/appMeta'
import type { WebPublicEnv, WebServerEnv } from './env/webEnv'
import type { AuthContext } from './middleware/auth'

export interface RequestContext extends AuthContext {
  serverEnv: WebServerEnv
  publicEnv: WebPublicEnv
  appMeta: AppMeta
}

declare module '@tanstack/react-start' {
  interface Register {
    server: {
      requestContext: RequestContext
    }
  }
}
```

Register middleware in `src/start.ts` and import the Register augmentation:
```typescript
import { webEnvMiddleware } from './middleware/webEnv'
import './register-request-context'

export const startInstance = createStart(() => ({
  requestMiddleware: [webEnvMiddleware],
}))
```

Browser-safe loader pattern (never return `serverEnv`):
```typescript
// serverFns.ts
export const getBrowserShellSession = createServerFn({ method: 'GET' }).handler(
  async ({ context }) =>
    toBrowserShellSession({
      publicEnv: context.publicEnv,
      appMeta: context.appMeta,
    }),
)

// root route loader
loader: async () => ({
  shellSession: await getBrowserShellSession(),
})
```

## Updating call sites

**observability/index.ts** — replace `process.env.SENTRY_DSN` with the
validated value from `webPublicEnv`:

```typescript
import { webPublicEnv } from '../../env/webEnv'

export function getObservability(options: GetObservabilityOptions): ObservabilityService {
  const dsn = options.publicEnv?.SENTRY_DSN ?? webPublicEnv.SENTRY_DSN
  if (!instance || instanceKey !== dsn) {
    instance = dsn ? new SentryObservability() : new NoopObservability()
    instanceKey = dsn
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

- [ ] `process.env` appears only in `src/env/*.ts` and one bootstrap schema parse in `instrument.env.mts`
- [ ] `createModuleLogger` / `createServerLogger` never call `process.env`
- [ ] `instrument.server.mts` uses `resolveSentryBootstrapEnv()` + `initSentry()`, and `pnpm build` emits `.output/server/instrument.*.mjs`
- [ ] `package.json` is copied next to the emitted instrument bundle so version import works
- [ ] `appMeta` is parsed once from `package.json` via `AppMetaSchema`
- [ ] `Register.server.requestContext` includes `serverEnv`, `publicEnv`, `appMeta` (+ auth)
- [ ] Browser config uses `getBrowserShellSession` / `toBrowserShellSession` from route loaders (not `window.__ENV__`, not raw `serverEnv`)
- [ ] `SENTRY_DSN` / `LOG_LEVEL` / `ENV` documented in `.env.example`
