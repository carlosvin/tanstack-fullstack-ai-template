import { MantineProvider } from '@mantine/core'
import type { UIMessage } from '@tanstack/ai-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMessage = vi.fn()
const getTask = vi.fn(async () => null)

vi.mock('../AgenticChat/AgenticChatContext', () => ({
	useAgenticChat: () => ({
		messages: chatMessages,
		isLoading: false,
		sendMessage,
	}),
}))

vi.mock('../../services/api/serverFns', () => ({
	getTask: (...args: unknown[]) => getTask(...args),
}))

const created = {
	id: 'task-7',
	title: 'Fix timeline display issue',
	description: 'The timeline view is not displaying correctly.',
	status: 'pending',
	priority: 'high',
	createdAt: '2026-10-12T20:00:00.000Z',
	updatedAt: '2026-10-12T20:00:00.000Z',
}

const chatMessages: UIMessage[] = [
	{
		id: 'list',
		role: 'assistant',
		parts: [
			{
				type: 'tool-call',
				id: 'call-list',
				name: 'showTasksView',
				arguments: '{}',
				input: {},
				state: 'output-available',
			},
			{
				type: 'tool-result',
				toolCallId: 'call-list',
				content: JSON.stringify({ tasks: [created], presentation: 'cards' }),
				state: 'output-available',
			},
		],
	},
]

import { AgenticThread } from './AgenticThread'

describe('AgenticThread open task', () => {
	beforeEach(() => {
		sendMessage.mockClear()
		getTask.mockClear()
	})

	it('opens a created task from the thread when the repository no longer has it', async () => {
		render(
			<MantineProvider>
				<AgenticThread />
			</MantineProvider>,
		)
		fireEvent.click(await screen.findByRole('button', { name: /Fix timeline display issue/ }))
		expect(await screen.findByRole('button', { name: 'All tasks' })).toBeTruthy()
		expect(screen.getAllByText('The timeline view is not displaying correctly.')).toHaveLength(2)
		expect(getTask).not.toHaveBeenCalled()
		expect(sendMessage).not.toHaveBeenCalled()
	})
})
