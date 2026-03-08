import {
	ActionIcon,
	Alert,
	Badge,
	Drawer,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Tooltip,
} from '@mantine/core'
import { clientTools, createChatClientOptions } from '@tanstack/ai-client'
import type { UIMessage } from '@tanstack/ai-react'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, Bot, Send, Square, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isUserFacingPath } from '../../services/ai/navigationManifest'
import { invalidateRouterToolDef, NavigateInputSchema, navigateToolDef } from '../../services/ai/tools'
import styles from './ChatDrawer.module.css'

function isInternalPath(href: string): boolean {
	try {
		const path = href.startsWith('/') ? href : new URL(href).pathname
		return path.startsWith('/') && !path.startsWith('/api/')
	} catch {
		return href.startsWith('/') && !href.startsWith('/api/')
	}
}

function parseInternalHref(href: string): { to: string; search?: Record<string, string> } {
	const [pathname, searchStr] = href.split('?')
	const to = pathname ?? href
	if (!searchStr) return { to }
	const search: Record<string, string> = {}
	for (const pair of searchStr.split('&')) {
		const [key, value] = pair.split('=')
		if (key && value !== undefined) search[decodeURIComponent(key)] = decodeURIComponent(value)
	}
	return { to, search }
}

/** Renders internal app links as Router Link, external as <a>. */
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
	if (!href) return <span>{children}</span>
	if (!isInternalPath(href)) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer">
				{children}
			</a>
		)
	}
	const { to, search } = parseInternalHref(href)
	return (
		<Link to={to} search={search} preload="intent" style={{ color: 'inherit', textDecoration: 'underline' }}>
			{children}
		</Link>
	)
}

interface ChatDrawerProps {
	opened: boolean
	onClose: () => void
}

/** Maps tool call names to user-friendly loading labels. */
function getToolLabel(toolName: string): string {
	const labels: Record<string, string> = {
		getTasks: 'searching tasks',
		getTask: 'loading task details',
		getAssignees: 'checking assignees',
		navigate: 'opening page',
		invalidateRouter: 'refreshing data',
		getCurrentUserContext: 'checking permissions',
		createTask: 'creating task',
		updateTask: 'updating task',
		deleteTask: 'deleting task',
	}
	return labels[toolName] ?? toolName
}

/** Renders a single chat message (user or assistant). */
function MessageBubble({ message }: { message: UIMessage }) {
	const isUser = message.role === 'user'

	const textParts: string[] = []
	const toolCallNames: string[] = []

	for (const part of message.parts) {
		if (part.type === 'text') {
			textParts.push((part as unknown as { type: 'text'; content: string }).content)
		} else if (part.type === 'tool-call') {
			toolCallNames.push((part as unknown as { type: 'tool-call'; name: string }).name)
		}
	}

	const textContent = textParts.join('')

	return (
		<div className={isUser ? styles.userMessage : styles.assistantMessage}>
			{!isUser && (
				<ThemeIcon size="sm" variant="light" radius="xl" mb={4}>
					<Bot size={14} />
				</ThemeIcon>
			)}
			{toolCallNames.length > 0 && (
				<Group gap={4} mb={4}>
					{/* Tool call list order is stable; index needed for duplicate tool names in same message */}
					{toolCallNames.map((name, i) => (
						<Badge key={`${message.id}-${name}-${String(i)}`} size="xs" variant="light">
							{getToolLabel(name)}
						</Badge>
					))}
				</Group>
			)}
			{textContent && (
				<Paper
					p="sm"
					radius="md"
					bg={isUser ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default)'}
					c={isUser ? 'white' : undefined}
				>
					{isUser ? (
						<Text size="sm">{textContent}</Text>
					) : (
						<div className={styles.markdown}>
							<Markdown remarkPlugins={[remarkGfm]} components={{ a: MarkdownLink }}>
								{textContent}
							</Markdown>
						</div>
					)}
				</Paper>
			)}
		</div>
	)
}

/** AI chat drawer component with streaming support via TanStack AI. */
export function ChatDrawer({ opened, onClose }: ChatDrawerProps) {
	const viewport = useRef<HTMLDivElement>(null)
	const [input, setInput] = useState('')
	const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
	const router = useRouter()

	useEffect(() => {
		if (opened && aiAvailable === null) {
			fetch('/api/chat')
				.then((res) => res.json())
				.then((data) => setAiAvailable(data.available === true))
				.catch(() => setAiAvailable(false))
		}
	}, [opened, aiAvailable])

	const navigateClient = navigateToolDef.client((args) => {
		const navInput = NavigateInputSchema.parse(args)
		const path = navInput.to.startsWith('/') ? navInput.to : `/${navInput.to}`
		if (!isUserFacingPath(path)) return { success: false }
		router.navigate({ to: path, search: navInput.search ?? undefined })
		return { success: true }
	})

	const invalidateClient = invalidateRouterToolDef.client(() => {
		router.invalidate()
		return { success: true }
	})

	const tools = clientTools(navigateClient, invalidateClient)

	const connection = useMemo(
		() =>
			fetchServerSentEvents('/api/chat', () => ({
				body: {
					browserContext: {
						timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						locale: navigator.language,
						currentTime: new Date().toISOString(),
						currentPathname: window.location.pathname,
						currentSearch: window.location.search,
						currentHref: window.location.href,
					},
				},
			})),
		[],
	)

	const chatOptions = createChatClientOptions({ connection, tools })

	const { messages, sendMessage, isLoading, clear, stop } = useChat(chatOptions)

	const scrollToBottom = useCallback(() => {
		viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [scrollToBottom])

	const isDisabled = aiAvailable === false

	const handleSubmit = () => {
		if (!input.trim() || isLoading || isDisabled) return
		sendMessage(input)
		setInput('')
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit()
		}
	}

	return (
		<Drawer opened={opened} onClose={onClose} title="AI Assistant" position="right" size="lg" padding="md">
			<Stack h="calc(100vh - 120px)" justify="space-between">
				<ScrollArea flex={1} viewportRef={viewport}>
					<Stack gap="md" p="xs">
						{isDisabled && (
							<Alert icon={<AlertTriangle size={16} />} title="AI assistant unavailable" color="yellow" variant="light">
								The AI assistant is not configured. Please set the required environment variables (AZURE_OPENAI_API_KEY,
								AZURE_OPENAI_ENDPOINT) to enable this feature.
							</Alert>
						)}
						{!isDisabled && messages.length === 0 && (
							<Text c="dimmed" ta="center" size="sm" py="xl">
								Ask me anything about your tasks!
							</Text>
						)}
						{messages.map((msg) => (
							<MessageBubble key={msg.id} message={msg} />
						))}
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

				<Stack gap="xs">
					<Group gap="xs">
						<Textarea
							flex={1}
							placeholder={isDisabled ? 'AI assistant is not configured' : 'Type a message...'}
							value={input}
							onChange={(e) => setInput(e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							autosize
							minRows={1}
							maxRows={4}
							disabled={isDisabled}
						/>
						{isLoading ? (
							<Tooltip label="Stop generating">
								<ActionIcon variant="subtle" onClick={stop} size="lg">
									<Square size={18} />
								</ActionIcon>
							</Tooltip>
						) : (
							<Tooltip label={isDisabled ? 'AI not configured' : 'Send'}>
								<ActionIcon variant="filled" onClick={handleSubmit} disabled={!input.trim() || isDisabled} size="lg">
									<Send size={18} />
								</ActionIcon>
							</Tooltip>
						)}
					</Group>
					{messages.length > 0 && (
						<Tooltip label="Clear conversation">
							<ActionIcon variant="subtle" color="gray" onClick={clear} size="sm" ml="auto">
								<Trash2 size={14} />
							</ActionIcon>
						</Tooltip>
					)}
				</Stack>
			</Stack>
		</Drawer>
	)
}
