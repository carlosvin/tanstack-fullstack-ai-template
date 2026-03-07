/**
 * Composable authorization guard helpers.
 *
 * These are called from server function handlers after the auth middleware
 * has populated context.user. They throw HttpError on failure, which is
 * caught by processResponse() for mutations or surfaces as a loader error
 * for queries.
 */
import type { AuthContext } from '../middleware/auth'
import type { UserIdentity } from '../types'
import { HttpError } from './httpError'

/** Requires an authenticated user. Returns the identity. Throws 401 if anonymous. */
export function requireAuth(context: AuthContext): UserIdentity {
	if (!context.user?.email) {
		throw new HttpError(401, 'Authentication required')
	}
	return context.user
}

/** Requires the user to belong to a specific group. Throws 403 if not a member. */
export function requireGroup(context: AuthContext, group: string): UserIdentity {
	const user = requireAuth(context)
	if (!user.groups.includes(group)) {
		throw new HttpError(403, `Membership in group "${group}" is required`)
	}
	return user
}
