import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import { MarkdownLink } from './MarkdownLink'

async function renderMarkdownLink(markdown: string) {
	const rootRoute = createRootRoute({
		component: () => (
			<Markdown remarkPlugins={[remarkGfm]} components={{ a: MarkdownLink }}>
				{markdown}
			</Markdown>
		),
	})
	const tasksRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/tasks',
		component: () => <div>Tasks page</div>,
	})
	const taskDetailRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/tasks/$taskId',
		component: () => <div>Task detail</div>,
	})
	const routeTree = rootRoute.addChildren([tasksRoute, taskDetailRoute])
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: ['/'] }),
	})

	await act(async () => {
		render(<RouterProvider router={router} />)
		await router.load()
	})

	return router
}

describe('MarkdownLink', () => {
	it('navigates to internal task detail routes', async () => {
		const router = await renderMarkdownLink('[View task](/tasks/task-1)')
		const link = screen.getByRole('link', { name: 'View task' })
		expect(link.getAttribute('href')).toBe('/tasks/task-1')
		await act(async () => {
			link.click()
		})
		expect(router.state.location.pathname).toBe('/tasks/task-1')
	})

	it('navigates to filtered task lists', async () => {
		const router = await renderMarkdownLink('[Done tasks](/tasks?status=done)')
		const link = screen.getByRole('link', { name: 'Done tasks' })
		await act(async () => {
			link.click()
		})
		expect(router.state.location.pathname).toBe('/tasks')
		expect(router.state.location.search).toEqual({ status: 'done' })
	})

	it('renders external links in a new tab', async () => {
		await renderMarkdownLink('[Docs](https://example.com/docs)')
		const link = screen.getByRole('link', { name: 'Docs' })
		expect(link.getAttribute('href')).toBe('https://example.com/docs')
		expect(link.getAttribute('target')).toBe('_blank')
	})

	it('renders invalid internal paths as plain text', async () => {
		await renderMarkdownLink('[Broken](/unknown)')
		expect(screen.queryByRole('link', { name: 'Broken' })).toBeNull()
		expect(screen.getByText('Broken')).toBeTruthy()
	})
})
