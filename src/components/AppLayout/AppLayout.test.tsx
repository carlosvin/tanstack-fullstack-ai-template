import { MantineProvider } from '@mantine/core'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ShellSession } from '../../env/webEnv'
import { AppLayout } from './AppLayout'

const shellSession = {
	app: { name: 'TaskHub', version: '1.0.0' },
} as ShellSession

async function renderAppLayout() {
	const rootRoute = createRootRoute({
		component: () => (
			<MantineProvider>
				<AppLayout shellSession={shellSession}>
					<div>Main content</div>
				</AppLayout>
			</MantineProvider>
		),
	})
	const tasksRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/tasks',
		component: () => null,
	})
	const router = createRouter({
		routeTree: rootRoute.addChildren([tasksRoute]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
	})

	await act(async () => {
		render(<RouterProvider router={router} />)
		await router.load()
	})

	return router
}

describe('AppLayout', () => {
	it('keeps the mobile nav open through intent preload until the route changes', async () => {
		const router = await renderAppLayout()
		const burger = screen.getByRole('button', { name: 'Toggle navigation' })

		fireEvent.click(burger)
		expect(burger.querySelector('[data-opened]')).toBeTruthy()

		const tasksLink = screen.getByRole('link', { name: /tasks/i })
		fireEvent.mouseEnter(tasksLink)
		await act(async () => {
			await router.preloadRoute({ to: '/tasks' })
		})

		expect(burger.querySelector('[data-opened]')).toBeTruthy()
		expect(router.state.location.pathname).toBe('/')

		await act(async () => {
			fireEvent.click(tasksLink)
			await router.load()
		})

		expect(router.state.location.pathname).toBe('/tasks')
		expect(burger.querySelector('[data-opened]')).toBeNull()
	})
})
