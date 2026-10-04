import { createFileRoute } from '@tanstack/react-router'
import { taskViewsMcpServer } from '../../services/ai/taskViewsMcp.server'

/**
 * MCP endpoint for the agentic task views.
 * The chat handler connects with `createMCPClient` against the same server.
 */
export const Route = createFileRoute('/api/mcp')({
	server: {
		handlers: {
			POST: ({ request }) => taskViewsMcpServer.fetch(request),
			GET: ({ request }) => taskViewsMcpServer.fetch(request),
			DELETE: ({ request }) => taskViewsMcpServer.fetch(request),
		},
	},
})
