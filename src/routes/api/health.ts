import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
	server: {
		handlers: {
			GET: () => {
				return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
			},
		},
	},
})
