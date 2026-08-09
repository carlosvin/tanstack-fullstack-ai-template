import { createRouter } from '@tanstack/react-router'
import { NotFoundPage } from './components/NotFoundPage/NotFoundPage'
import { routeTree } from './routeTree.gen'

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
