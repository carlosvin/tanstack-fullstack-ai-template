import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildAppNavigation, getNavigationPromptSection, matchUserFacingRoute } from './navigationManifest'

describe('matchUserFacingRoute', () => {
	it('matches static routes', () => {
		expect(matchUserFacingRoute('/')).toEqual({ to: '/' })
		expect(matchUserFacingRoute('/tasks')).toEqual({ to: '/tasks' })
		expect(matchUserFacingRoute('/tasks/new')).toEqual({ to: '/tasks/new' })
	})

	it('matches dynamic task routes', () => {
		expect(matchUserFacingRoute('/tasks/task-42')).toEqual({
			to: '/tasks/$taskId',
			params: { taskId: 'task-42' },
		})
		expect(matchUserFacingRoute('/tasks/task-42/edit')).toEqual({
			to: '/tasks/$taskId/edit',
			params: { taskId: 'task-42' },
		})
	})

	it('rejects unknown paths', () => {
		expect(matchUserFacingRoute('/unknown')).toBeNull()
		expect(matchUserFacingRoute('/api/chat')).toBeNull()
	})
})

describe('buildAppNavigation', () => {
	it('derives user-facing routes and search params from the router', () => {
		const SearchSchema = z.object({
			status: z.string().optional().describe('Filter by status: pending | in-progress | done | cancelled'),
		})

		const rootRoute = createRootRoute()
		const indexRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/',
			staticData: { description: 'Home page' },
		})
		const tasksRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/tasks',
			validateSearch: SearchSchema,
			staticData: { description: 'Tasks list with optional filters' },
		})
		const apiRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: '/api/chat',
			staticData: { description: 'should be excluded' },
		})
		const router = createRouter({
			routeTree: rootRoute.addChildren([indexRoute, tasksRoute, apiRoute]),
			history: createMemoryHistory({ initialEntries: ['/'] }),
		})

		const nav = buildAppNavigation(router)
		expect(nav.map((r) => r.path)).toEqual(['/', '/tasks'])
		expect(nav.find((r) => r.path === '/tasks')?.searchParams).toEqual([
			{ name: 'status', description: 'Filter by status: pending | in-progress | done | cancelled' },
		])
		expect(getNavigationPromptSection(nav)).toContain('**/tasks**: Tasks list with optional filters')
		expect(getNavigationPromptSection(nav)).not.toContain('/api/chat')
	})
})
