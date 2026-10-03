import { Drawer, Stack, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChatComposer } from '../PromptChat/ChatComposer'
import { ChatThread } from '../PromptChat/ChatThread'

interface ChatDrawerProps {
	opened: boolean
	onClose: () => void
}

/** Promptable UI (side): hidden drawer wired to shared PromptChatProvider. */
export function ChatDrawer({ opened, onClose }: ChatDrawerProps) {
	const theme = useMantineTheme()
	const isSmUp = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true)

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			title="AI Assistant"
			position="right"
			size={isSmUp ? 'lg' : '100%'}
			padding="md"
		>
			<Stack h="calc(100dvh - 120px)" justify="space-between">
				<ChatThread />
				<ChatComposer />
			</Stack>
		</Drawer>
	)
}
