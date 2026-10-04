import { Button, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core'
import type { ToolResultPart, UIResourcePart } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-react'
import { useEffect, useRef } from 'react'
import { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from '../../services/mcpUi/mcpUiResource'
import { suggestedPrompts } from '../../utils/suggestedPrompts'
import { useAgenticChat } from '../AgenticChat/AgenticChatContext'
import { AgenticMcpRenderer } from '../AgenticMcp/AgenticMcpRenderer'
import { MessageBubble } from '../PromptChat/MessageBubble'
import { AgenticPromptMarkdownLink } from './AgenticPromptMarkdownLink'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function messageUiResources(message: UIMessage): UIResourcePart[] {
	const found: UIResourcePart[] = []
	for (const part of message.parts) {
		if (part.type === 'ui-resource') found.push(part)
	}
	return found
}

function toolResultText(part: ToolResultPart): string {
	if (typeof part.content === 'string') return part.content
	return part.content.map((block) => (block.type === 'text' ? block.content : '')).join('')
}

function toolContext(message: UIMessage, toolCallId: string) {
	let toolInput: Record<string, unknown> | undefined
	let resultText: string | undefined
	let toolFailed = false
	for (const part of message.parts) {
		if (part.type === 'tool-call' && part.id === toolCallId) {
			const raw = part.input
			if (isRecord(raw)) toolInput = raw
		}
		if (part.type === 'tool-result' && part.toolCallId === toolCallId) {
			resultText = toolResultText(part)
			toolFailed = part.state === 'error'
		}
	}
	return { toolInput, resultText, toolFailed }
}

function retryPrompt(uri: string, toolInput: Record<string, unknown> | undefined): string {
	if (uri === TASKS_LIST_UI_URI) return 'Show my tasks'
	if (uri === TASK_DETAIL_UI_URI) {
		const id = toolInput && typeof toolInput.id === 'string' ? toolInput.id : ''
		if (id) return `Show task ${id}`
	}
	return 'Please show that view again'
}

/**
 * Conversation stage for the agentic shell: assistant markdown plus
 * tool-linked MCP UI resources. Text-only results stay markdown.
 */
export function AgenticThread({ scrollHeight }: { scrollHeight?: string | number }) {
	const { messages, isLoading, sendMessage } = useAgenticChat()
	const viewportRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = viewportRef.current
		if (!el || typeof el.scrollTo !== 'function') return
		if (messages.length === 0 && !isLoading) return
		el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
	}, [messages, isLoading])

	return (
		<ScrollArea h={scrollHeight} viewportRef={viewportRef} type="auto">
			<Stack gap="md" p="xs">
				{messages.length === 0 && (
					<Stack gap="sm" py="md">
						<Text ta="center" size="lg" fw={600}>
							What do you want to get done?
						</Text>
						<Text c="dimmed" ta="center" size="sm">
							Ask in plain language — lists, details, and forms appear here as interactive views.
						</Text>
						{suggestedPrompts.length > 0 ? (
							<Group gap="xs" justify="center">
								{suggestedPrompts.map((prompt) => (
									<Button key={prompt} variant="light" size="compact-sm" onClick={() => sendMessage(prompt)}>
										{prompt}
									</Button>
								))}
							</Group>
						) : null}
					</Stack>
				)}
				{messages.map((msg) => {
					const resources = msg.role === 'user' ? [] : messageUiResources(msg)
					return (
						<Stack key={msg.id} gap="sm">
							<MessageBubble
								message={msg}
								markdownLinkComponent={(props) => <AgenticPromptMarkdownLink {...props} onPrompt={sendMessage} />}
							/>
							{resources.map((part) => {
								const context = toolContext(msg, part.toolCallId)
								return (
									<AgenticMcpRenderer
										key={`${part.toolCallId}-${part.resource.uri}`}
										part={part}
										toolInput={context.toolInput}
										toolResultText={context.resultText}
										toolFailed={context.toolFailed}
										onPrompt={sendMessage}
										onRetry={() => sendMessage(retryPrompt(part.resource.uri, context.toolInput))}
									/>
								)
							})}
						</Stack>
					)
				})}
				{isLoading && messages[messages.length - 1]?.role === 'user' && (
					<Group gap="xs">
						<Loader size="xs" />
						<Text size="xs" c="dimmed">
							Thinking...
						</Text>
					</Group>
				)}
			</Stack>
		</ScrollArea>
	)
}
