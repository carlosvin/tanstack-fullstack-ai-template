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

	return (
		<Container size="md" h="100%" py="sm" px={{ base: 'xs', sm: 'md' }}>
			<ChatThread maxHeight="calc(100dvh - 160px)" showSuggestions={false} />
		</Container>
	)
}
