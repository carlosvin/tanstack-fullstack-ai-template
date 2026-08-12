import {
	type TaskRepo,
	TaskRepoSchema,
	type UserAccessRepo,
	UserAccessRepoSchema,
	type UserProfileRepo,
	UserProfileRepoSchema,
} from './repository'

/** MongoDB / external document → repository-layer task (validated). */
export function parseTaskRepo(doc: unknown): TaskRepo {
	return TaskRepoSchema.parse(doc)
}

export function parseTaskRepoOrNull(doc: unknown | null | undefined): TaskRepo | null {
	return doc == null ? null : TaskRepoSchema.parse(doc)
}

/** MongoDB / external document → repository-layer user profile (validated). */
export function parseUserProfileRepoOrNull(doc: unknown | null | undefined): UserProfileRepo | null {
	return doc == null ? null : UserProfileRepoSchema.parse(doc)
}

/** Profile row → access record (roles derived from the profile role). */
export function toUserAccessRepo(profile: UserProfileRepo): UserAccessRepo {
	return UserAccessRepoSchema.parse({
		email: profile.email,
		name: profile.name,
		roles: profile.role ? [profile.role] : [],
	})
}
