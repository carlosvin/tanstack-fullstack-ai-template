import { ActionIcon, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { CheckSquare, ListTodo, MessageCircle, Moon, Sun } from 'lucide-react'
import type { UserIdentity, UserProfile } from '../../types'

interface HeaderProps {
	currentUser?: { identity: UserIdentity; profile: UserProfile | null }
	onOpenChat?: () => void
}

/** Application header with navigation, color scheme toggle, and AI chat trigger. */
export function Header({ currentUser, onOpenChat }: HeaderProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const displayName = currentUser?.profile?.name || currentUser?.identity.name

	const handleOpenChat = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		onOpenChat?.()
	}

	return (
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
					<ActionIcon type="button" variant="subtle" onClick={toggleColorScheme} size="lg">
						{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
					</ActionIcon>
				</Tooltip>

				<Tooltip label="Ask AI">
					<ActionIcon type="button" variant="subtle" onClick={handleOpenChat} size="lg" aria-label="Open AI chat">
						<MessageCircle size={18} />
					</ActionIcon>
				</Tooltip>
			</Group>
		</Group>
	)
}
