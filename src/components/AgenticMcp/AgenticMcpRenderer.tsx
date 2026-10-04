import { Alert, Button, Paper, Stack, Text } from '@mantine/core'
import { AppRenderer } from '@mcp-ui/client'
import type { UIResourcePart } from '@tanstack/ai'
import { useMcpAppBridge } from '@tanstack/ai-react'
import { useCallback, useMemo, useState } from 'react'
import { decodeMcpUiHtml, isAllowedMcpUiUri, MCP_APP_MIME_TYPE } from '../../services/mcpUi/mcpUiResource'

const MCP_APP_CALL_ENDPOINT = '/api/mcp-apps/call'
const AGENTIC_THREAD_ID = 'agentic'

interface AgenticMcpRendererProps {
	part: UIResourcePart
	toolInput?: Record<string, unknown>
	toolResultText?: string
	toolFailed?: boolean
	onPrompt: (text: string) => void
	onRetry?: () => void
}

function sandboxUrl(): URL {
	const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
	return new URL('/sandbox_proxy.html', origin)
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** MCP `CallToolResult` for `AppRenderer`, built from the chat tool-result text. */
export function toMcpToolResult(raw: string, failed: boolean) {
	let structured: Record<string, unknown> | undefined
	try {
		const parsed: unknown = JSON.parse(raw)
		if (isRecord(parsed)) structured = parsed
	} catch {
		structured = undefined
	}
	const isError = failed || (structured !== undefined && typeof structured.error === 'string')
	return {
		content: [{ type: 'text' as const, text: raw }],
		...(structured ? { structuredContent: structured } : {}),
		...(isError ? { isError: true as const } : {}),
	}
}

/**
 * Host renderer for a tool-linked MCP Apps view.
 * The document comes from `resources/read`. `AppRenderer` passes the tool
 * result into the sandbox so the guest can paint it. Prompts and links go
 * through `useMcpAppBridge`.
 */
export function AgenticMcpRenderer({
	part,
	toolInput,
	toolResultText,
	toolFailed = false,
	onPrompt,
	onRetry,
}: AgenticMcpRendererProps) {
	const [attempt, setAttempt] = useState(0)
	const resource = part.resource
	const valid = isAllowedMcpUiUri(resource.uri) && resource.mimeType === MCP_APP_MIME_TYPE
	const html = valid ? decodeMcpUiHtml(resource) : null
	const sandbox = useMemo(() => ({ url: sandboxUrl() }), [])
	const toolResult = toolResultText === undefined ? undefined : toMcpToolResult(toolResultText, toolFailed)

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
			<AppRenderer
				toolName={part.toolName}
				toolResourceUri={resource.uri}
				html={html}
				sandbox={sandbox}
				toolInput={toolInput}
				toolResult={toolResult}
				onCallTool={async ({ name, arguments: args }) => {
					const result = await bridge.callTool({
						serverId: part.serverId,
						toolName: name,
						args,
					})
					const structuredContent = isRecord(result) ? result : undefined
					const text = typeof result === 'string' ? result : (JSON.stringify(result) ?? 'null')
					return {
						content: [{ type: 'text' as const, text }],
						structuredContent,
					}
				}}
				onMessage={async ({ content }) => {
					const text = content
						.filter((block): block is { type: 'text'; text: string } => block.type === 'text')
						.map((block) => block.text)
						.join('')
					if (text) await bridge.sendPrompt(text)
					return {}
				}}
				onOpenLink={({ url }) => Promise.resolve(bridge.openLink(url))}
			/>
		</Paper>
	)
}
