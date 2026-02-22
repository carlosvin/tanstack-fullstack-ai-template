import { ActionIcon, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link } from '@tanstack/react-router'
import { CheckSquare, ListTodo, MessageCircle, Moon, Sun } from 'lucide-react'
import type { UserIdentity, UserProfile } from '../../types'
import { ChatDrawer } from '../ChatDrawer/ChatDrawer'

interface HeaderProps {
	currentUser?: { identity: UserIdentity; profile: UserProfile | null }
}

/** Application header with navigation, color scheme toggle, and AI chat trigger. */
export function Header({ currentUser }: HeaderProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false)

	const displayName = currentUser?.profile?.name || currentUser?.identity.name

	return (
		<>
			<Group h="100%" px="md" justify="space-between">
				<Group gap="md">
					<Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
						<Group gap="xs">
							<CheckSquare size={20} />
							<Text fw={700} size="lg">
								TaskHub
							</Text>
						</Group>
					</Link>

					<Link to="/tasks" style={{ textDecoration: 'none', color: 'inherit' }}>
						<Group gap={4}>
							<ListTodo size={16} />
							<Text size="sm">Tasks</Text>
						</Group>
					</Link>
				</Group>

				<Group gap="xs">
					{displayName && (
						<Text size="sm" c="dimmed">
							{displayName}
						</Text>
					)}

					<Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
						<ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
							{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
						</ActionIcon>
					</Tooltip>

					<Tooltip label="Ask AI">
						<ActionIcon variant="subtle" onClick={openChat} size="lg">
							<MessageCircle size={18} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>

			<ChatDrawer opened={chatOpened} onClose={closeChat} />
		</>
	)
}
