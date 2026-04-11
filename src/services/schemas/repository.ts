/**
 * Repository-layer Zod schemas — internal shapes matching the persisted data model.
 *
 * These schemas deliberately omit .describe() because they are not exposed to
 * AI tools or external consumers. The tools-layer schemas in schemas.ts carry
 * the rich metadata for JSON Schema generation.
 *
 * Repository interfaces and implementations import types from here.
 * Server functions map between these and the tools-layer schemas.
 */
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'

// ---------------------------------------------------------------------------
// User Profile (persisted document shape)
// ---------------------------------------------------------------------------

export const UserProfileRepoSchema = z.object({
	email: z.string(),
	name: z.string(),
	role: z.string().optional(),
	avatarUrl: z.string().optional(),
	preferences: z
		.object({
			theme: z.enum(['light', 'dark', 'auto']).default('auto'),
		})
		.optional(),
})

export type UserProfileRepo = z.infer<typeof UserProfileRepoSchema>

// ---------------------------------------------------------------------------
// Task (persisted document shape)
// ---------------------------------------------------------------------------

export const TaskRepoInputSchema = z.object({
	title: z.string().min(1),
	description: z.string().optional(),
	status: z.enum(TASK_STATUSES).default('pending'),
	priority: z.enum(TASK_PRIORITIES).default('medium'),
	assignee: z.string().optional(),
})

export type TaskRepoInput = z.infer<typeof TaskRepoInputSchema>

export const TaskRepoSchema = TaskRepoInputSchema.extend({
	id: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	createdBy: z.string().optional(),
})

export type TaskRepo = z.infer<typeof TaskRepoSchema>

// ---------------------------------------------------------------------------
// Filter (query parameters accepted by the repository layer)
// ---------------------------------------------------------------------------

export const TaskRepoFilterSchema = z.object({
	status: z.enum(TASK_STATUSES).optional(),
	priority: z.enum(TASK_PRIORITIES).optional(),
	assignee: z.string().optional(),
	search: z.string().optional(),
})

export type TaskRepoFilter = z.infer<typeof TaskRepoFilterSchema>
