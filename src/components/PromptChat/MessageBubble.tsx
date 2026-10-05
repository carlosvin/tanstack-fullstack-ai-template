import { Badge, Group, Paper, Text, ThemeIcon } from '@mantine/core'
import type { UIMessage } from '@tanstack/ai-react'
import { Bot } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownLink } from './MarkdownLink'
import styles from './PromptChat.module.css'
import { getToolLabel } from './toolLabels'

type MarkdownLinkComponent = React.ComponentType<{ href?: string; children?: React.ReactNode }>

export function MessageBubble({
	message,
	markdownLinkComponent,
}: {
	message: UIMessage
	markdownLinkComponent?: MarkdownLinkComponent
}) {
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
	if (!isUser && !textContent && toolCallNames.length === 0) return null

	return (
		<div className={isUser ? styles.userMessage : styles.assistantMessage}>
			{!isUser && (
				<ThemeIcon size="sm" variant="light" radius="xl" mb={4}>
					<Bot size={14} />
				</ThemeIcon>
			)}
			{toolCallNames.length > 0 && (
				<Group gap={4} mb={4}>
					{toolCallNames.map((name, i) => (
						<Badge key={`${message.id}-${name}-${String(i)}`} size="xs" variant="light" tt="none">
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
							<Markdown remarkPlugins={[remarkGfm]} components={{ a: markdownLinkComponent ?? MarkdownLink }}>
								{textContent}
							</Markdown>
						</div>
					)}
				</Paper>
			)}
		</div>
	)
}
