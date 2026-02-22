import { beforeEach, describe, expect, it } from 'vitest'
import { SeedRepository } from './seedRepository'

describe('SeedRepository', () => {
	let repo: SeedRepository

	beforeEach(() => {
		repo = new SeedRepository()
	})

	describe('getTasks', () => {
		it('returns all seed tasks with no filter', async () => {
			const tasks = await repo.getTasks()
			expect(tasks.length).toBeGreaterThan(0)
		})

		it('filters by status', async () => {
			const tasks = await repo.getTasks({ status: 'done' })
			for (const t of tasks) {
				expect(t.status).toBe('done')
			}
		})

		it('filters by priority', async () => {
			const tasks = await repo.getTasks({ priority: 'high' })
			for (const t of tasks) {
				expect(t.priority).toBe('high')
			}
		})

		it('filters by search term', async () => {
			const tasks = await repo.getTasks({ search: 'database' })
			expect(tasks.length).toBeGreaterThan(0)
			expect(tasks[0].title.toLowerCase()).toContain('database')
		})
	})

	describe('getTask', () => {
		it('returns a task by ID', async () => {
			const task = await repo.getTask('task-1')
			expect(task).not.toBeNull()
			expect(task?.id).toBe('task-1')
		})

		it('returns null for unknown ID', async () => {
			const task = await repo.getTask('nonexistent')
			expect(task).toBeNull()
		})
	})

	describe('getAssignees', () => {
		it('returns sorted unique assignees', async () => {
			const assignees = await repo.getAssignees()
			expect(assignees.length).toBeGreaterThan(0)
			const sorted = [...assignees].sort()
			expect(assignees).toEqual(sorted)
		})
	})

	describe('createTask', () => {
		it('creates a task with generated ID and timestamps', async () => {
			const task = await repo.createTask({ title: 'New task', status: 'pending', priority: 'low' }, 'test@example.com')
			expect(task.id).toBeTruthy()
			expect(task.title).toBe('New task')
			expect(task.createdBy).toBe('test@example.com')
			expect(task.createdAt).toBeTruthy()
		})
	})

	describe('updateTask', () => {
		it('updates a task and changes updatedAt', async () => {
			const before = await repo.getTask('task-1')
			const updated = await repo.updateTask('task-1', { title: 'Updated title' })
			expect(updated?.title).toBe('Updated title')
			expect(updated?.updatedAt).not.toBe(before?.updatedAt)
		})

		it('returns null for unknown task', async () => {
			const result = await repo.updateTask('nonexistent', { title: 'x' })
			expect(result).toBeNull()
		})
	})

	describe('deleteTask', () => {
		it('deletes an existing task', async () => {
			const result = await repo.deleteTask('task-1')
			expect(result).toBe(true)
			const task = await repo.getTask('task-1')
			expect(task).toBeNull()
		})

		it('returns false for unknown task', async () => {
			const result = await repo.deleteTask('nonexistent')
			expect(result).toBe(false)
		})
	})

	describe('getUserProfile', () => {
		it('returns a profile for a known email', async () => {
			const profile = await repo.getUserProfile('alice@example.com')
			expect(profile).not.toBeNull()
			expect(profile?.email).toBe('alice@example.com')
			expect(profile?.name).toBe('Alice Johnson')
			expect(profile?.role).toBe('Engineering Lead')
		})

		it('matches email case-insensitively', async () => {
			const profile = await repo.getUserProfile('Alice@Example.COM')
			expect(profile).not.toBeNull()
			expect(profile?.email).toBe('alice@example.com')
		})

		it('returns null for an unknown email', async () => {
			const profile = await repo.getUserProfile('unknown@example.com')
			expect(profile).toBeNull()
		})
	})
})
