import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		defaultStaleTime: 30_000,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
		scrollRestoration: true,
	})

	return router
}
