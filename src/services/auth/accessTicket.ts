import type { UserIdentity, UserProfile } from '../../types'
import { HttpError } from '../../utils/httpError'

/** Auth ticket assembled by middleware from identity + repository profile. */
export interface AccessTicket {
	identity: UserIdentity
	profile: UserProfile | null
	isTestUser: boolean
	/** Combined IdP groups and repository profile role. */
	roles: string[]
	/**
	 * Ensures the ticket holder may mutate a task.
	 * Throws 403 when `createdBy` is set and does not match the ticket email.
	 */
	requireTaskCreator(task: { createdBy?: string }): void
}

export interface BuildAccessTicketInput {
	user: UserIdentity
	profile: UserProfile | null
	isTestUser: boolean
}

/** Build a request AccessTicket from JWT identity and repository profile. */
export function buildAccessTicket(input: BuildAccessTicketInput): AccessTicket {
	const { user, profile, isTestUser } = input
	const roles = [...new Set([...user.groups, ...(profile?.role ? [profile.role] : [])])]

	return {
		identity: user,
		profile,
		isTestUser,
		roles,
		requireTaskCreator(task) {
			if (task.createdBy && task.createdBy !== user.email) {
				throw new HttpError(403, 'Only the task creator can change this task')
			}
		},
	}
}
