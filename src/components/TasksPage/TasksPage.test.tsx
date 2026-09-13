import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import type { Task } from '../../types'
import { TasksPage } from './TasksPage'

vi.mock('../Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const sampleTask: Task = {
	id: 'task-1',
	title: 'Set up project repository',
	status: 'done',
	priority: 'high',
	createdAt: '2025-01-15T09:00:00Z',
	updatedAt: '2025-01-16T14:30:00Z',
}

describe('TasksPage', () => {
	it('renders a searchbox with supported ARIA attributes only', () => {
		renderWithProviders(
			<TasksPage tasks={[sampleTask]} search={{}} isAuth={false} onUpdateSearch={vi.fn()} onDeleteTask={vi.fn()} />,
		)

		const searchInput = screen.getByRole('searchbox', { name: 'Search tasks' })

		expect(searchInput.getAttribute('id')).toBe('search')
		expect(searchInput.getAttribute('type')).toBe('search')
		expect(searchInput.getAttribute('aria-label')).toBe('Search tasks')
		expect(searchInput.getAttribute('aria-expanded')).toBeNull()
		expect(searchInput.getAttribute('aria-controls')).toBeNull()
		expect(searchInput.getAttribute('aria-autocomplete')).toBeNull()
	})
})
