import type { TokenPolicy } from '@/services/auth/tokenPolicy'
import type { UserIdentity } from '@/services/schemas/schemas'
import { type ResolvedAccessTicket, resolveAccessTicket } from '@/utils/testAuth.server'

const ANONYMOUS: UserIdentity = { email: '', name: 'Anonymous', groups: [] }

/**
 * Turn a verified-or-null header identity + cookie into the request principal.
 *
 * Verified deployments never fall through to the demo cookie: a missing,
 * invalid, or email-less bearer becomes anonymous so mutations 401.
 * `header-off` and `unsigned-dev` keep the demo cookie for local browsing.
 */
export function resolveRequestAccess(
	policy: TokenPolicy,
	headerIdentity: UserIdentity | null,
	cookieToken: string | null | undefined,
): ResolvedAccessTicket {
	if (headerIdentity?.email) {
		return { user: headerIdentity, isTestUser: false }
	}

	if (policy.mode === 'verified') {
		return { user: ANONYMOUS, isTestUser: false }
	}

	return resolveAccessTicket(null, cookieToken)
}
