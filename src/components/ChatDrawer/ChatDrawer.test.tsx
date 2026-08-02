import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Link as RouterLink,
	RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import { toInternalRouterLinkTarget } from '../../utils/internalLinks'

function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
	if (!href) return <span>{children}</span>

	const linkTarget = toInternalRouterLinkTarget(href)
	if (linkTarget) {
		return (
			<RouterLink
				to={linkTarget.to}
				{...(linkTarget.params ? { params: linkTarget.params } : {})}
				{...(linkTarget.search ? { search: linkTarget.search } : {})}
				preload="intent"
			>
				{children}
			</RouterLink>
		)
	}

	return (
		<a href={href} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	)
}

async function renderMarkdownLink(markdown: string, initialEntry = '/') {
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
		history: createMemoryHistory({ initialEntries: [initialEntry] }),
	})

	await act(async () => {
		render(<RouterProvider router={router} />)
		await router.load()
	})

	return router
}

describe('ChatDrawer markdown internal links', () => {
	it('renders internal task detail links as router links', async () => {
		const router = await renderMarkdownLink('[View task](/tasks/task-1)')
		const link = screen.getByRole('link', { name: 'View task' })
		expect(link.getAttribute('href')).toBe('/tasks/task-1')
		await act(async () => {
			link.click()
		})
		expect(router.state.location.pathname).toBe('/tasks/task-1')
	})

	it('renders filtered task list links with search params', async () => {
		const router = await renderMarkdownLink('[Done tasks](/tasks?status=done)')
		const link = screen.getByRole('link', { name: 'Done tasks' })
		expect(link.getAttribute('href')).toBe('/tasks?status=done')
		await act(async () => {
			link.click()
		})
		expect(router.state.location.pathname).toBe('/tasks')
		expect(router.state.location.search).toEqual({ status: 'done' })
	})

	it('renders external links as anchors with target blank', async () => {
		await renderMarkdownLink('[Docs](https://example.com/docs)')
		const link = screen.getByRole('link', { name: 'Docs' })
		expect(link.getAttribute('href')).toBe('https://example.com/docs')
		expect(link.getAttribute('target')).toBe('_blank')
	})
})
