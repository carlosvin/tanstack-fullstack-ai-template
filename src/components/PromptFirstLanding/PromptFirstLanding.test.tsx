import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import type { Task } from '../../types'
import { PromptFirstLanding } from './PromptFirstLanding'

let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; content: string }> }> = []

vi.mock('../PromptChat/PromptChatContext', () => ({
	usePromptChat: () => ({
		messages: mockMessages,
		isLoading: false,
		sendMessage: vi.fn(),
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

describe('PromptFirstLanding', () => {
	it('renders the hero when there are no messages', () => {
		mockMessages = []
		renderWithProviders(<PromptFirstLanding tasks={sampleTasks} />)

		expect(screen.getByRole('heading', { name: /how can i help you today/i })).toBeTruthy()
		// Ensures traditional dashboard stats/cards are NOT rendered
		expect(screen.queryByText('Recent Tasks')).toBeNull()
		expect(screen.queryByText('Total')).toBeNull()
	})

	it('renders the conversation thread when messages exist', () => {
		mockMessages = [
			{
				id: 'm1',
				role: 'user',
				parts: [{ type: 'text', content: 'What are my pending tasks?' }],
			},
			{
				id: 'm2',
				role: 'assistant',
				parts: [{ type: 'text', content: 'You have 1 pending task.' }],
			},
		]

		renderWithProviders(<PromptFirstLanding tasks={sampleTasks} />)

		expect(screen.queryByRole('heading', { name: /how can i help you today/i })).toBeNull()
		expect(screen.getByText('What are my pending tasks?')).toBeTruthy()
		expect(screen.getByText('You have 1 pending task.')).toBeTruthy()
		// And still no dashboard stacked below!
		expect(screen.queryByText('Recent Tasks')).toBeNull()
	})
})
