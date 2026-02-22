import type { Task, TaskFilter, TaskInput, UserProfile } from '../../types'
import type { Repository } from './types'

/** Sample seed data for development without a database. */
const SEED_TASKS: Task[] = [
	{
		id: 'task-1',
		title: 'Set up project repository',
		description: 'Initialize the Git repository, add README, configure CI/CD pipeline.',
		status: 'done',
		priority: 'high',
		assignee: 'alice@example.com',
		createdBy: 'alice@example.com',
		createdAt: '2025-01-15T09:00:00Z',
		updatedAt: '2025-01-16T14:30:00Z',
	},
	{
		id: 'task-2',
		title: 'Design database schema',
		description: 'Define collections and indexes for the MongoDB data model.',
		status: 'in-progress',
		priority: 'high',
		assignee: 'bob@example.com',
		createdBy: 'alice@example.com',
		createdAt: '2025-01-16T10:00:00Z',
		updatedAt: '2025-01-18T11:00:00Z',
	},
	{
		id: 'task-3',
		title: 'Implement authentication',
		description: 'Add JWT-based auth middleware with role support.',
		status: 'pending',
		priority: 'critical',
		assignee: 'alice@example.com',
		createdBy: 'bob@example.com',
		createdAt: '2025-01-17T08:00:00Z',
		updatedAt: '2025-01-17T08:00:00Z',
	},
	{
		id: 'task-4',
		title: 'Write API documentation',
		description: 'Document all server function endpoints and their schemas.',
		status: 'pending',
		priority: 'medium',
		assignee: 'charlie@example.com',
		createdBy: 'alice@example.com',
		createdAt: '2025-01-18T12:00:00Z',
		updatedAt: '2025-01-18T12:00:00Z',
	},
	{
		id: 'task-5',
		title: 'Add dark mode support',
		description: 'Ensure all components render correctly in both light and dark color schemes.',
		status: 'done',
		priority: 'low',
		assignee: 'charlie@example.com',
		createdBy: 'charlie@example.com',
		createdAt: '2025-01-14T15:00:00Z',
		updatedAt: '2025-01-15T17:00:00Z',
	},
]

const SEED_USERS: UserProfile[] = [
	{
		email: 'alice@example.com',
		name: 'Alice Johnson',
		role: 'Engineering Lead',
		avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=AJ',
		preferences: { theme: 'dark' },
	},
	{
		email: 'bob@example.com',
		name: 'Bob Smith',
		role: 'Backend Developer',
		avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=BS',
	},
	{
		email: 'charlie@example.com',
		name: 'Charlie Davis',
		role: 'Technical Writer',
		avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=CD',
		preferences: { theme: 'light' },
	},
]

let nextId = SEED_TASKS.length + 1

/**
 * In-memory seed repository for development and demos.
 * Mutations modify the in-memory array (not persisted across restarts).
 */
export class SeedRepository implements Repository {
	private tasks: Task[] = [...SEED_TASKS]
	private users: UserProfile[] = [...SEED_USERS]

	async getTasks(filter?: TaskFilter): Promise<Task[]> {
		let result = [...this.tasks]

		if (filter?.status) {
			result = result.filter((t) => t.status === filter.status)
		}
		if (filter?.priority) {
			result = result.filter((t) => t.priority === filter.priority)
		}
		if (filter?.assignee) {
			result = result.filter((t) => t.assignee === filter.assignee)
		}
		if (filter?.search) {
			const q = filter.search.toLowerCase()
			result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
		}

		return result
	}

	async getTask(taskId: string): Promise<Task | null> {
		return this.tasks.find((t) => t.id === taskId) ?? null
	}

	async getAssignees(): Promise<string[]> {
		const assignees = new Set(this.tasks.map((t) => t.assignee).filter(Boolean) as string[])
		return [...assignees].sort()
	}

	async getUserProfile(email: string): Promise<UserProfile | null> {
		return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
	}

	async createTask(input: TaskInput, createdBy?: string): Promise<Task> {
		const now = new Date().toISOString()
		const task: Task = {
			...input,
			id: `task-${++nextId}`,
			createdAt: now,
			updatedAt: now,
			createdBy,
		}
		this.tasks.push(task)
		return task
	}

	async updateTask(taskId: string, input: Partial<TaskInput>): Promise<Task | null> {
		const index = this.tasks.findIndex((t) => t.id === taskId)
		if (index === -1) return null

		this.tasks[index] = {
			...this.tasks[index],
			...input,
			updatedAt: new Date().toISOString(),
		}
		return this.tasks[index]
	}

	async deleteTask(taskId: string): Promise<boolean> {
		const index = this.tasks.findIndex((t) => t.id === taskId)
		if (index === -1) return false
		this.tasks.splice(index, 1)
		return true
	}
}
