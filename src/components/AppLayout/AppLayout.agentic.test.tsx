import { MantineProvider } from '@mantine/core'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ShellSession } from '../../services/schemas/shellSession'
import { AppLayout } from './AppLayout'

vi.mock('../AgenticChat/AgenticChatContext', () => ({
	AgenticChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../AgenticShell/AgenticShell', () => ({
	AgenticShell: () => <main>Agentic shell</main>,
}))

vi.mock('../PromptChat/PromptChatContext', () => ({
	PromptChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const shellSession = {
	app: { name: 'TaskHub Agentic', version: '1.0.0' },
	promptConcept: 'agentic',
} as ShellSession

describe('AppLayout agentic', () => {
	it('renders the tool-only shell with no nav, drawer, or domain content', async () => {
		const rootRoute = createRootRoute({
			component: () => (
				<MantineProvider>
					<AppLayout shellSession={shellSession} aiAvailable>
						<div>Main content</div>
					</AppLayout>
				</MantineProvider>
			),
		})
		const router = createRouter({
			routeTree: rootRoute,
			history: createMemoryHistory({ initialEntries: ['/'] }),
		})

		await act(async () => {
			render(<RouterProvider router={router} />)
			await router.load()
		})

		expect(screen.getByText('Agentic shell')).toBeTruthy()
		expect(screen.queryByText('Main content')).toBeNull()
		expect(screen.queryByRole('button', { name: 'Toggle navigation' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
	})
})
