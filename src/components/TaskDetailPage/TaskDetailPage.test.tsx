import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import type { Task } from '../../types'
import { TaskDetailPage } from './TaskDetailPage'

vi.mock('../Link/Link', () => ({
	Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

const sampleTask: Task = {
	id: 'task-1',
	title: 'Set up project repository',
	description: 'Initialize the repo',
	status: 'done',
	priority: 'high',
	createdAt: '2025-01-15T09:00:00Z',
	updatedAt: '2025-01-16T14:30:00Z',
	createdBy: 'alice@example.com',
}

describe('TaskDetailPage', () => {
	it('shows an empty state when the task is missing', () => {
		renderWithProviders(
			<TaskDetailPage task={null} isCreator={false} onEdit={() => undefined} onDelete={() => undefined} />,
		)
		expect(screen.getByText('Task not found')).toBeTruthy()
	})

	it('shows edit and delete only for the creator', () => {
		renderWithProviders(
			<TaskDetailPage task={sampleTask} isCreator onEdit={() => undefined} onDelete={() => undefined} />,
		)
		expect(screen.getByRole('heading', { name: 'Set up project repository' })).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy()
	})
})
