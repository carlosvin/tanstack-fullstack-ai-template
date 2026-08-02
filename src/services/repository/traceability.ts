import type { TraceabilityContext } from './types'

/** Build a create-side audit context from the authenticated user's email. */
export function createWriteTrace(email: string): TraceabilityContext {
	return { createdBy: email }
}

/** Build an update-side audit context from the authenticated user's email. */
export function updateWriteTrace(email: string): TraceabilityContext {
	return { lastModifiedBy: email }
}

/** Resolve lastModifiedBy on create — prefer explicit lastModifiedBy, else createdBy. */
export function resolveCreateLastModifiedBy(trace?: TraceabilityContext): string | undefined {
	return trace?.lastModifiedBy ?? trace?.createdBy
}
