import { Button, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core'
import type { UIResourcePart } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-react'
import { useCallback, useEffect, useRef } from 'react'
import { suggestedPrompts } from '../../utils/suggestedPrompts'
import { useAgenticChat } from '../AgenticChat/AgenticChatContext'
import { AgenticMcpRenderer } from '../AgenticMcp/AgenticMcpRenderer'
import { MessageBubble } from '../PromptChat/MessageBubble'
import { AgenticPromptMarkdownLink } from './AgenticPromptMarkdownLink'

function messageUiResources(message: UIMessage): UIResourcePart[] {
	const found: UIResourcePart[] = []
	for (const part of message.parts) {
		if (part.type === 'ui-resource') found.push(part)
	}
	return found
}

function retryPromptForResourceUri(uri: string): string {
	if (uri === 'ui://tasks/list') return 'Show my tasks'
	if (uri.startsWith('ui://task/detail-')) {
		const id = uri.slice('ui://task/detail-'.length)
		if (id && id !== 'detail') return `Show task ${id}`
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

	const scrollToBottom = useCallback(() => {
		const el = viewportRef.current
		if (el && typeof el.scrollTo === 'function') {
			el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
		}
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [scrollToBottom])

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
							{resources.map((part) => (
								<AgenticMcpRenderer
									key={`${part.toolCallId}-${part.resource.uri}`}
									part={part}
									onPrompt={sendMessage}
									onRetry={() => sendMessage(retryPromptForResourceUri(part.resource.uri))}
								/>
							))}
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
