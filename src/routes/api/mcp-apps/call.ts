import { createFileRoute } from '@tanstack/react-router'

/**
 * Widget tool-call endpoint for `useMcpAppBridge`.
 * Views in this shell send follow-up prompts instead of calling tools directly,
 * so a stray `tools/call` from the iframe is refused. Writes stay on the chat
 * tools, which already enforce the auth ticket.
 */
export const Route = createFileRoute('/api/mcp-apps/call')({
	server: {
		handlers: {
			POST: async () => {
				return Response.json({
					ok: false,
					error: 'This shell sends widget actions as prompts. Direct widget tool calls are not enabled.',
				})
			},
		},
	},
})
