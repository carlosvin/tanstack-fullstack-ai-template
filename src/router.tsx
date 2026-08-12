import { createRouter } from '@tanstack/react-router'
import { NotFoundPage } from './components/NotFoundPage/NotFoundPage'
import { routeTree } from './routeTree.gen'

declare module '@tanstack/react-router' {
	interface StaticDataRouteOption {
		/** Human-readable route summary for the AI navigation manifest. */
		description?: string
	}
}

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		defaultStaleTime: 30_000,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
		scrollRestoration: true,
		defaultNotFoundComponent: NotFoundPage,
	})

	return router
}
