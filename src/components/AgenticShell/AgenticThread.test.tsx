import { MantineProvider } from '@mantine/core'
import type { UIMessage } from '@tanstack/ai-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMessage = vi.fn()
const getTask = vi.fn(async (_input: unknown) => null)

vi.mock('@/components/AgenticChat/AgenticChatContext', () => ({
	useAgenticChat: () => ({
		messages: chatMessages,
		isLoading: false,
		sendMessage,
	}),
}))

vi.mock('@/services/api/serverFns', () => ({
	getTask: (input: unknown) => getTask(input),
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
				state: 'complete',
			},
			{
				type: 'tool-result',
				toolCallId: 'call-list',
				content: JSON.stringify({ tasks: [created], presentation: 'cards' }),
				state: 'complete',
			},
		],
	},
]

import { AgenticThread } from '@/components/AgenticShell/AgenticThread'

const initialMessages: UIMessage[] = [...chatMessages]

describe('AgenticThread open task', () => {
	beforeEach(() => {
		sendMessage.mockClear()
		getTask.mockClear()
		chatMessages.splice(0, chatMessages.length, ...initialMessages.map((message) => structuredClone(message)))
	})

	it('opens a created task from the thread when the repository no longer has it', async () => {
		render(
			<MantineProvider>
				<AgenticThread />
			</MantineProvider>,
		)
		fireEvent.click(await screen.findByRole('button', { name: /^Fix timeline display issue/ }))
		expect(await screen.findByRole('button', { name: 'All tasks' })).toBeTruthy()
		expect(screen.getAllByText('The timeline view is not displaying correctly.')).toHaveLength(2)
		expect(getTask).not.toHaveBeenCalled()
		expect(sendMessage).not.toHaveBeenCalled()
	})

	it('drops opened task details after the conversation is cleared', async () => {
		const { rerender } = render(
			<MantineProvider>
				<AgenticThread />
			</MantineProvider>,
		)
		fireEvent.click(await screen.findByRole('button', { name: /^Fix timeline display issue/ }))
		expect(await screen.findByRole('button', { name: 'All tasks' })).toBeTruthy()

		chatMessages.splice(0, chatMessages.length)
		rerender(
			<MantineProvider>
				<AgenticThread />
			</MantineProvider>,
		)
		expect(screen.queryByRole('button', { name: 'All tasks' })).toBeNull()

		chatMessages.push({
			id: 'next',
			role: 'user',
			parts: [{ type: 'text', content: 'Show overdue tasks' }],
		})
		rerender(
			<MantineProvider>
				<AgenticThread />
			</MantineProvider>,
		)

		expect(screen.getByText('Show overdue tasks')).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'All tasks' })).toBeNull()
	})
})
