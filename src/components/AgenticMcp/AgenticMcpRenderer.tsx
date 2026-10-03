import { Alert, Button, Paper, Stack, Text } from '@mantine/core'
import type { UIResourcePart } from '@tanstack/ai'
import { useMcpAppBridge } from '@tanstack/ai-react'
import { MCPAppResource } from '@tanstack/ai-react/mcp-apps'
import { useCallback, useMemo, useState } from 'react'
import { decodeMcpUiHtml, isAllowedMcpUiUri, MCP_APP_MIME_TYPE } from '../../services/mcpUi/mcpUiResource'

const MCP_APP_CALL_ENDPOINT = '/api/mcp-apps/call'
const AGENTIC_THREAD_ID = 'agentic'

interface AgenticMcpRendererProps {
	part: UIResourcePart
	onPrompt: (text: string) => void
	onRetry?: () => void
}

function sandboxUrl(): URL {
	const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
	return new URL('/sandbox_proxy.html', origin)
}

/**
 * Host renderer for a tool-linked MCP Apps view.
 * `MCPAppResource` loads `public/sandbox_proxy.html` and renders the resource
 * HTML inside that sandbox. Prompts and links go through `useMcpAppBridge`.
 */
export function AgenticMcpRenderer({ part, onPrompt, onRetry }: AgenticMcpRendererProps) {
	const [attempt, setAttempt] = useState(0)
	const resource = part.resource
	const valid = isAllowedMcpUiUri(resource.uri) && resource.mimeType === MCP_APP_MIME_TYPE
	const html = valid ? decodeMcpUiHtml(resource) : null
	const sandbox = useMemo(() => ({ url: sandboxUrl() }), [])

	const bridge = useMcpAppBridge({
		threadId: AGENTIC_THREAD_ID,
		callEndpoint: MCP_APP_CALL_ENDPOINT,
		chat: {
			sendMessage: async (content) => {
				onPrompt(content)
			},
		},
		onLink: (url) => {
			window.open(url, '_blank', 'noopener,noreferrer')
		},
	})

	const handleRetry = useCallback(() => {
		if (onRetry) onRetry()
		else onPrompt('Please show that view again')
		setAttempt((n) => n + 1)
	}, [onPrompt, onRetry])

	if (!valid || html === null) {
		return (
			<Alert color="yellow" title="View unavailable">
				<Stack gap="xs">
					<Text size="sm">
						This interactive view failed validation and was not rendered. The text answer above still applies.
					</Text>
					<Button variant="light" size="compact-sm" onClick={handleRetry}>
						Retry
					</Button>
				</Stack>
			</Alert>
		)
	}

	return (
		<Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }} key={`${resource.uri}-${attempt}`}>
			<MCPAppResource part={{ ...part, resource: { ...resource, text: html } }} bridge={bridge} sandbox={sandbox} />
		</Paper>
	)
}
