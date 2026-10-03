import { Alert, Button, Paper, Skeleton, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	decodeMcpUiHtml,
	isAllowedMcpUiUri,
	MCP_APP_MIME_TYPE,
	type McpUiResourceContent,
} from '../../services/mcpUi/mcpUiResource'

interface AgenticMcpRendererProps {
	resource: McpUiResourceContent
	onPrompt: (text: string) => void
	onNotify?: (text: string) => void
	onToolAction?: (toolName: string, params: unknown) => void
	onRetry?: () => void
}

type McpUiHostMessage = {
	type: 'prompt' | 'link' | 'notify' | 'tool' | 'intent'
	payload?: { text?: string; url?: string; message?: string; toolName?: string; params?: unknown }
}

function isHostMessage(value: unknown): value is McpUiHostMessage {
	if (typeof value !== 'object' || value === null) return false
	const type = (value as Record<string, unknown>).type
	return type === 'prompt' || type === 'link' || type === 'notify' || type === 'tool' || type === 'intent'
}

/**
 * MCP-UI-wire-compatible host renderer: sandboxed iframe only.
 * The host document never injects tool HTML. Widget actions map to
 * tools or prompts — never to in-app routes.
 */
export function AgenticMcpRenderer({ resource, onPrompt, onNotify, onToolAction, onRetry }: AgenticMcpRendererProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [loaded, setLoaded] = useState(false)
	const [attempt, setAttempt] = useState(0)
	const [notice, setNotice] = useState<string | null>(null)

	const valid = isAllowedMcpUiUri(resource.uri) && resource.mimeType === MCP_APP_MIME_TYPE
	const html = valid ? decodeMcpUiHtml(resource) : null

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			const frame = iframeRef.current
			if (!frame || event.source !== frame.contentWindow) return
			if (!isHostMessage(event.data)) return
			const payload = event.data.payload ?? {}
			switch (event.data.type) {
				case 'prompt':
					if (typeof payload.text === 'string' && payload.text.trim()) onPrompt(payload.text)
					break
				case 'link':
					if (typeof payload.url === 'string') window.open(payload.url, '_blank', 'noopener,noreferrer')
					break
				case 'notify':
					if (typeof payload.message === 'string') {
						if (onNotify) onNotify(payload.message)
						else setNotice(payload.message)
					}
					break
				case 'tool':
				case 'intent':
					if (typeof payload.toolName === 'string' && onToolAction) {
						onToolAction(payload.toolName, payload.params)
					} else if (typeof payload.text === 'string' && payload.text.trim()) {
						onPrompt(payload.text)
					}
					break
			}
		},
		[onPrompt, onNotify, onToolAction],
	)

	useEffect(() => {
		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [handleMessage])

	useEffect(() => {
		setLoaded(false)
	}, [])

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
			{!loaded ? <Skeleton height={240} /> : null}
			{notice ? (
				<Text size="xs" c="dimmed" px="sm" pt="xs">
					{notice}
				</Text>
			) : null}
			<iframe
				ref={iframeRef}
				title={`Interactive view ${resource.uri}`}
				srcDoc={html}
				sandbox="allow-scripts"
				style={{ width: '100%', height: 360, border: 0, display: loaded ? 'block' : 'none' }}
				onLoad={() => setLoaded(true)}
			/>
		</Paper>
	)
}
