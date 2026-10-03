import { Container } from '@mantine/core'
import type { Task } from '../../types'
import { ChatThread } from '../PromptChat/ChatThread'
import { usePromptChat } from '../PromptChat/PromptChatContext'
import { PromptFirstHero } from '../PromptFirstHero/PromptFirstHero'

interface PromptFirstLandingProps {
	tasks: Task[]
}

export function PromptFirstLanding({ tasks }: PromptFirstLandingProps) {
	const { messages } = usePromptChat()

	if (messages.length === 0) {
		return <PromptFirstHero tasks={tasks} />
	}

	const threadScrollHeight =
		'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-footer-height) - var(--app-shell-padding) * 2)'

	return (
		<Container size="md" py="sm" px={{ base: 'xs', sm: 'md' }}>
			<ChatThread scrollHeight={threadScrollHeight} showSuggestions={false} />
		</Container>
	)
}
