import type { TaskRepo, UserProfileRepo } from './repository'
import { TaskSchema, UserProfileSchema } from './schemas'

/** Repository row → tools/API task shape. */
export function toToolTask(row: TaskRepo) {
	return TaskSchema.parse({
		id: row.id,
		title: row.title,
		description: row.description,
		status: row.status,
		priority: row.priority,
		assignee: row.assignee,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		createdBy: row.createdBy,
	})
}

/** Repository profile → tools/API user profile shape. */
export function toToolUserProfile(row: UserProfileRepo) {
	return UserProfileSchema.parse({
		email: row.email,
		name: row.name,
		role: row.role,
		avatarUrl: row.avatarUrl,
		preferences: row.preferences,
	})
}
