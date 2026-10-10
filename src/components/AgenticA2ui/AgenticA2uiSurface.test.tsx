import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildTaskViewMessages } from '../../services/a2ui/taskViewMessages'
import type { Task } from '../../services/schemas/schemas'
import { AgenticA2uiSurface } from './AgenticA2uiSurface'

const task: Task = {
	id: 'task-1',
	title: 'Ship the report',
	description: 'Quarterly summary',
	status: 'pending',
	priority: 'high',
	assignee: 'ada@example.com',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderSurface(colorScheme: 'light' | 'dark', onAction = vi.fn()) {
	return render(
		<MantineProvider defaultColorScheme={colorScheme}>
			<AgenticA2uiSurface messages={buildTaskViewMessages({ tasks: [task] })} onAction={onAction} />
		</MantineProvider>,
	)
}

describe('AgenticA2uiSurface', () => {
	it('renders the task card in light and dark schemes', async () => {
		const { unmount } = renderSurface('light')
		expect(await screen.findByText('Ship the report')).toBeTruthy()
		expect(screen.getByText('pending')).toBeTruthy()
		unmount()
		renderSurface('dark')
		expect(await screen.findByText('Ship the report')).toBeTruthy()
		expect(screen.getByText('ada@example.com')).toBeTruthy()
	})

	it('opens the named task from the card without showing the id', async () => {
		const onAction = vi.fn()
		renderSurface('light', onAction)
		const card = await screen.findByRole('button', { name: /Ship the report/ })
		expect(card.textContent).not.toContain('task-1')
		const label = card.querySelector('[class*="label"]')
		expect(label?.getAttribute('style') ?? '').toMatch(/text-align:\s*left/)
		fireEvent.click(card)
		expect(onAction).toHaveBeenCalledWith(
			expect.objectContaining({
				actionName: 'open-task',
				context: expect.objectContaining({ taskId: 'task-1', title: 'Ship the report' }),
			}),
		)
	})

	it('renders the detail view and sends the list action', async () => {
		const onAction = vi.fn()
		render(
			<MantineProvider>
				<AgenticA2uiSurface messages={buildTaskViewMessages({ task })} onAction={onAction} />
			</MantineProvider>,
		)
		expect(await screen.findByText('Quarterly summary')).toBeTruthy()
		expect(screen.getByText('Ship the report')).toBeTruthy()
		expect(screen.queryByText('task-1')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'All tasks' }))
		expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ actionName: 'back-to-list' }))
	})

	it('renders nothing for a component type outside the catalog', async () => {
		render(
			<MantineProvider>
				<AgenticA2uiSurface
					messages={[
						{
							surfaceUpdate: {
								surfaceId: '@default',
								components: [{ id: 'root', component: { NotAWidget: { text: { literalString: 'pwned' } } } }],
							},
						},
						{ beginRendering: { surfaceId: '@default', root: 'root' } },
					]}
					onAction={vi.fn()}
				/>
			</MantineProvider>,
		)
		expect(screen.queryByText('pwned')).toBeNull()
		expect(await screen.findByTestId('task-view')).toBeTruthy()
		expect(screen.queryByText('pwned')).toBeNull()
	})
})
