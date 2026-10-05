import { Container, Group, Loader, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import type { ToolResultPart, UIResourcePart } from '@tanstack/ai'
import type { UIMessage } from '@tanstack/ai-react'
import { Bot } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from '../../services/mcpUi/mcpUiResource'
import { useAgenticChat } from '../AgenticChat/AgenticChatContext'
import { AgenticMcpRenderer } from '../AgenticMcp/AgenticMcpRenderer'
import { MessageBubble } from '../PromptChat/MessageBubble'
import { AgenticPromptMarkdownLink } from './AgenticPromptMarkdownLink'
import styles from './AgenticThread.module.css'

const AGENTIC_STARTERS = ['Show my tasks', 'Show pending tasks', 'Show high priority tasks']

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
		const id =
			toolInput && typeof toolInput.taskId === 'string'
				? toolInput.taskId
				: toolInput && typeof toolInput.id === 'string'
					? toolInput.id
					: ''
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

	const isEmpty = messages.length === 0

	return (
		<ScrollArea h={scrollHeight} viewportRef={viewportRef} type="auto" classNames={{ content: styles.content }}>
			<Container size="md" p={0} className={isEmpty ? styles.empty : undefined}>
				<Stack gap="md" p="xs" w="100%">
					{isEmpty && (
						<Stack align="center" gap="lg" py="xl">
							<ThemeIcon size={64} radius="xl" variant="light" color="teal">
								<Bot size={32} />
							</ThemeIcon>
							<Stack align="center" gap={4}>
								<Title order={2} ta="center">
									What should we look at?
								</Title>
								<Text c="dimmed" ta="center" size="sm" maw={440}>
									Ask for a list, a filter, or one task. The view shows up here.
								</Text>
							</Stack>
							<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" w="100%">
								{AGENTIC_STARTERS.map((prompt) => (
									<button key={prompt} type="button" className={styles.starter} onClick={() => sendMessage(prompt)}>
										<Text component="span" size="sm" fw={500}>
											{prompt}
										</Text>
									</button>
								))}
							</SimpleGrid>
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
			</Container>
		</ScrollArea>
	)
}
