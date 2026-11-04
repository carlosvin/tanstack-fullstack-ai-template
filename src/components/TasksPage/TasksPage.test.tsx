import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TasksPage } from '@/components/TasksPage/TasksPage'
import type { Task } from '@/services/schemas/schemas'
import { renderWithProviders } from '@/test-utils/renderWithRouter'

vi.mock('@/components/Link/Link', () => ({
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

	it('keeps ids outside the current result when selecting visible rows', () => {
		const onUpdateSearch = vi.fn()
		renderWithProviders(
			<TasksPage
				tasks={[
					{ ...sampleTask, id: 'visible-a', title: 'Visible A' },
					{ ...sampleTask, id: 'visible-b', title: 'Visible B' },
				]}
				assignees={[]}
				search={{ selected: ['hidden', 'visible-a'] }}
				isAuth
				isTestUser={false}
				today="2026-11-01"
				currentUserEmail="alice@example.com"
				onUpdateSearch={onUpdateSearch}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		fireEvent.click(screen.getByRole('checkbox', { name: 'Select visible' }))
		expect(onUpdateSearch).toHaveBeenCalledWith({ selected: ['hidden', 'visible-a', 'visible-b'] }, true)
	})

	it('clears only the visible selection', () => {
		const onUpdateSearch = vi.fn()
		renderWithProviders(
			<TasksPage
				tasks={[
					{ ...sampleTask, id: 'visible-a', title: 'Visible A' },
					{ ...sampleTask, id: 'visible-b', title: 'Visible B' },
				]}
				assignees={[]}
				search={{ selected: ['hidden', 'visible-a', 'visible-b'] }}
				isAuth
				isTestUser={false}
				today="2026-11-01"
				currentUserEmail="alice@example.com"
				onUpdateSearch={onUpdateSearch}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		fireEvent.click(screen.getByRole('checkbox', { name: 'Select visible' }))
		expect(onUpdateSearch).toHaveBeenCalledWith({ selected: ['hidden'] }, true)
	})

	it('stops at 50 selected ids instead of dropping earlier ones', () => {
		const onUpdateSearch = vi.fn()
		const hidden = Array.from({ length: 49 }, (_, index) => `hidden-${index}`)
		renderWithProviders(
			<TasksPage
				tasks={[
					{ ...sampleTask, id: 'visible-a', title: 'Visible A' },
					{ ...sampleTask, id: 'visible-b', title: 'Visible B' },
				]}
				assignees={[]}
				search={{ selected: hidden }}
				isAuth
				isTestUser={false}
				today="2026-11-01"
				currentUserEmail="alice@example.com"
				onUpdateSearch={onUpdateSearch}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		fireEvent.click(screen.getByRole('checkbox', { name: 'Select visible' }))
		const next = onUpdateSearch.mock.calls[0]?.[0].selected as string[]
		expect(next).toHaveLength(50)
		expect(next[0]).toBe('hidden-0')
		expect(next).toContain('visible-a')
		expect(next).not.toContain('visible-b')
	})

	it('refuses a new row once 50 ids are already selected', () => {
		const onUpdateSearch = vi.fn()
		const hidden = Array.from({ length: 50 }, (_, index) => `hidden-${index}`)
		renderWithProviders(
			<TasksPage
				tasks={[{ ...sampleTask, id: 'visible-b', title: 'Visible B' }]}
				assignees={[]}
				search={{ selected: hidden }}
				isAuth
				isTestUser={false}
				today="2026-11-01"
				currentUserEmail="alice@example.com"
				onUpdateSearch={onUpdateSearch}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		fireEvent.click(screen.getByRole('checkbox', { name: 'Select Visible B' }))
		expect(onUpdateSearch).not.toHaveBeenCalled()
	})

	it('marks overdue from the list asOf date', () => {
		renderWithProviders(
			<TasksPage
				tasks={[{ ...sampleTask, status: 'pending', dueDate: '2026-10-01', title: 'File the report' }]}
				assignees={[]}
				search={{ asOf: '2026-09-01' }}
				isAuth={false}
				isTestUser={false}
				today="2026-11-01"
				onUpdateSearch={() => undefined}
				onDeleteTask={() => undefined}
				onBulkStatus={() => undefined}
			/>,
		)

		expect(screen.queryByText(/^Overdue /)).toBeNull()
		expect(screen.getByText(/^Due /)).toBeTruthy()
	})
})
