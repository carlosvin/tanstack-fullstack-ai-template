import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import type { Task } from '../../types'
import { TasksPage } from './TasksPage'

vi.mock('../Link/Link', () => ({
	Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

const sampleTask: Task = {
	id: 'task-1',
	title: 'Set up project repository',
	status: 'done',
	priority: 'high',
	createdAt: '2025-01-15T09:00:00Z',
	updatedAt: '2025-01-16T14:30:00Z',
	createdBy: 'alice@example.com',
}

describe('TasksPage', () => {
	it('renders tasks and hides mutations for anonymous users', () => {
		renderWithProviders(
			<TasksPage
				tasks={[sampleTask]}
				assignees={[]}
				search={{}}
				isAuth={false}
				isTestUser={false}
				today="2026-10-17"
				onUpdateSearch={() => undefined}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		expect(screen.getByText('Set up project repository')).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Add task' })).toBeNull()
		expect(screen.queryByLabelText('Delete task')).toBeNull()
	})

	it('shows add and delete controls for the creator when authenticated', () => {
		renderWithProviders(
			<TasksPage
				tasks={[sampleTask]}
				assignees={[{ email: 'alice@example.com', name: 'Alice Johnson' }]}
				search={{}}
				isAuth
				isTestUser={false}
				today="2026-10-17"
				currentUserEmail="alice@example.com"
				onUpdateSearch={() => undefined}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		expect(screen.getByRole('button', { name: 'Add task' })).toBeTruthy()
		expect(screen.getByLabelText('Delete task')).toBeTruthy()
	})
})
