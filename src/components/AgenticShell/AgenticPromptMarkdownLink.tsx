import { UnstyledButton } from '@mantine/core'
import type { ReactNode } from 'react'
import { isInternalPath, toInternalRouterLinkTarget } from '../../utils/internalLinks'
import { MarkdownLink } from '../PromptChat/MarkdownLink'

function hasVisibleLabel(children: ReactNode): boolean {
	if (children == null || children === false) return false
	if (typeof children === 'string' || typeof children === 'number') return String(children).trim().length > 0
	if (Array.isArray(children)) return children.some(hasVisibleLabel)
	return true
}

function internalHrefToPrompt(href: string): string | null {
	const target = toInternalRouterLinkTarget(href)
	if (!target) return null
	const taskId = (target.params as { taskId?: string } | undefined)?.taskId
	if (taskId) return `Show task ${taskId}`
	if (target.to === '/tasks/new') return 'Create a new task'
	if (target.to === '/tasks') return 'Show my tasks'
	return 'Show my tasks'
}

/** Agentic shell: internal markdown links become follow-up prompts, not router navigation. */
export function AgenticPromptMarkdownLink({
	href,
	children,
	onPrompt,
}: {
	href?: string
	children?: React.ReactNode
	onPrompt: (text: string) => void
}) {
	if (!href) return <span>{children}</span>

	const prompt = internalHrefToPrompt(href)
	if (prompt) {
		return (
			<UnstyledButton
				type="button"
				onClick={() => onPrompt(prompt)}
				style={{ color: 'inherit', textDecoration: 'underline', font: 'inherit', padding: 0 }}
			>
				{hasVisibleLabel(children) ? children : prompt}
			</UnstyledButton>
		)
	}

	if (isInternalPath(href)) return <span>{children}</span>

	return <MarkdownLink href={href}>{children}</MarkdownLink>
}
