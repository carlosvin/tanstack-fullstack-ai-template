import { MantineProvider } from '@mantine/core'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ShellSession } from '../../services/schemas/shellSession'
import { AppLayout } from './AppLayout'

vi.mock('../PromptBar/PromptBar', () => ({
	PromptBar: () => <section aria-label="AI assistant">Prompt bar</section>,
}))

vi.mock('../PromptChat/PromptChatContext', () => ({
	PromptChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const shellSession = {
	app: { name: 'TaskHub First', version: '1.0.0' },
	promptConcept: 'prompt-first',
} as ShellSession

describe('AppLayout prompt-first', () => {
	it('renders the prompt bar and no drawer opener when AI is available', async () => {
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

		expect(screen.getByRole('region', { name: 'AI assistant' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Open AI chat' })).toBeNull()
		expect(screen.getByText('Main content')).toBeTruthy()
	})
})
