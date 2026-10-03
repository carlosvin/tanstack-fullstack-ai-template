import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import type { Task } from '../../types'
import { PromptFirstHero } from './PromptFirstHero'

const mockSendMessage = vi.fn()

vi.mock('../PromptChat/PromptChatContext', () => ({
	usePromptChat: () => ({
		sendMessage: mockSendMessage,
	}),
}))

vi.mock('../Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const sampleTasks: Task[] = [
	{
		id: 'task-1',
		title: 'Task 1',
		status: 'pending',
		priority: 'high',
		createdAt: '2025-01-15T09:00:00Z',
		updatedAt: '2025-01-16T14:30:00Z',
	},
]

describe('PromptFirstHero', () => {
	it('renders heading, task count badge, and suggestion prompt buttons', () => {
		renderWithProviders(<PromptFirstHero tasks={sampleTasks} />)

		expect(screen.getByRole('heading', { name: /how can i help you today/i })).toBeTruthy()
		expect(screen.getByText('1 tasks in workspace')).toBeTruthy()
		expect(screen.getByText('Summarize my task overview')).toBeTruthy()
	})

	it('calls sendMessage when a suggestion prompt is clicked', () => {
		renderWithProviders(<PromptFirstHero tasks={sampleTasks} />)

		const promptButton = screen.getByText('Summarize my task overview')
		fireEvent.click(promptButton)

		expect(mockSendMessage).toHaveBeenCalledWith('Summarize my task overview')
	})

	it('renders a link to browse tasks directly', () => {
		renderWithProviders(<PromptFirstHero tasks={sampleTasks} />)

		const browseLink = screen.getByRole('link', { name: /browse all tasks directly/i })
		expect(browseLink.getAttribute('href')).toBe('/tasks')
	})
})
