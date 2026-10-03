import { Anchor, Badge, Container, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Bot, Sparkles } from 'lucide-react'
import type { Task } from '../../types'
import { suggestedPrompts } from '../../utils/suggestedPrompts'
import { Link } from '../Link/Link'
import { usePromptChat } from '../PromptChat/PromptChatContext'

interface PromptFirstHeroProps {
	tasks?: Task[]
}

export function PromptFirstHero({ tasks }: PromptFirstHeroProps) {
	const { sendMessage } = usePromptChat()

	return (
		<Container size="sm" py={{ base: 'xl', sm: '3rem' }}>
			<Stack align="center" gap="lg">
				<ThemeIcon size={64} radius="xl" variant="light" color="teal">
					<Bot size={32} />
				</ThemeIcon>

				<Stack align="center" gap="xs">
					<Title order={2} ta="center">
						How can I help you today?
					</Title>
					<Text c="dimmed" ta="center" size="sm" maw={460}>
						Ask questions about your tasks, request summaries, or trigger workspace actions with natural language.
					</Text>
					{tasks && tasks.length > 0 ? (
						<Badge variant="light" color="teal" size="sm" mt={4}>
							{tasks.length} tasks in workspace
						</Badge>
					) : null}
				</Stack>

				<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" w="100%" mt="sm">
					{suggestedPrompts.map((prompt) => (
						<Paper
							key={prompt}
							withBorder
							p="md"
							radius="md"
							component="button"
							type="button"
							onClick={() => sendMessage(prompt)}
							style={{
								cursor: 'pointer',
								textAlign: 'left',
								backgroundColor: 'var(--mantine-color-default)',
								transition: 'border-color 150ms ease, background-color 150ms ease',
							}}
						>
							<Group justify="space-between" align="flex-start" wrap="nowrap">
								<Text size="sm" fw={500}>
									{prompt}
								</Text>
								<Sparkles size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
							</Group>
						</Paper>
					))}
				</SimpleGrid>

				<Anchor component={Link} to="/tasks" size="xs" c="dimmed" mt="xs">
					Or browse all tasks directly →
				</Anchor>
			</Stack>
		</Container>
	)
}
