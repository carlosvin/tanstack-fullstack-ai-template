import { Paper, Stack, Text, Title, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChatComposer } from '../PromptChat/ChatComposer'
import { ChatThread } from '../PromptChat/ChatThread'

/**
 * Prompt-first shell: always-visible prompt above page content.
 * Conversation state lives in PromptChatProvider on AppLayout.
 */
export function PromptBar() {
	const theme = useMantineTheme()
	const isSmUp = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true)
	const threadMaxHeight = isSmUp ? 280 : 200

	return (
		<Paper withBorder radius="md" p="md" mb="md" component="section" aria-label="AI assistant">
			<Stack gap="sm">
				<div>
					<Title order={4}>AI Assistant</Title>
					<Text size="sm" c="dimmed">
						Ask about tasks, open pages, or create updates — then drill into the sections below.
					</Text>
				</div>
				<ChatThread maxHeight={threadMaxHeight} showSuggestions />
				<ChatComposer />
			</Stack>
		</Paper>
	)
}
