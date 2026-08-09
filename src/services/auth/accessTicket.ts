import type { UserIdentity, UserProfile } from '../../types'
import { HttpError } from '../../utils/httpError'
import type { UserAccessRepo } from '../schemas/repository'

/** Auth ticket assembled by middleware from identity + repository access. */
export interface AccessTicket {
	identity: UserIdentity
	profile: UserProfile | null
	isTestUser: boolean
	/** Combined IdP groups and repository roles. */
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
	access: UserAccessRepo | null
}

/** Build a request AccessTicket from JWT identity and repository access data. */
export function buildAccessTicket(input: BuildAccessTicketInput): AccessTicket {
	const { user, profile, isTestUser, access } = input
	const roles = [
		...new Set([
			...user.groups,
			...(access?.roles ?? []),
			...(access?.role ? [access.role] : []),
			...(profile?.role ? [profile.role] : []),
		]),
	]

	return {
		identity: user,
		profile,
		isTestUser,
		roles,
		requireTaskCreator(task) {
			if (task.createdBy && task.createdBy !== user.email) {
				throw new HttpError(403, 'Only the task creator can edit this task')
			}
		},
	}
}
