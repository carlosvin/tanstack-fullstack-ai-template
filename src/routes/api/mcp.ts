import { createFileRoute } from '@tanstack/react-router'
import { handleMcp } from '@/services/ai/mcpServer.server'

/**
 * Optional MCP HTTP endpoint — same server tools as `/api/chat` data plane.
 * Point an MCP host (Cursor, Claude Desktop, …) at this URL.
 */
export const Route = createFileRoute('/api/mcp')({
	server: {
		handlers: {
			GET: ({ request }) => handleMcp(request),
			POST: ({ request }) => handleMcp(request),
			DELETE: ({ request }) => handleMcp(request),
		},
	},
})
