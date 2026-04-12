import { ActionIcon, Button, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { CheckSquare, Code, ListTodo, MessageCircle, Moon, Sun } from 'lucide-react'
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

				<Tooltip label="View source on GitHub">
					<ActionIcon
						component="a"
						href="https://github.com/carlosvin/tanstack-fullstack-ai-template"
						target="_blank"
						rel="noopener noreferrer"
						variant="subtle"
						size="lg"
						aria-label="View source on GitHub"
					>
						<Code size={18} />
					</ActionIcon>
				</Tooltip>

				<Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
					<ActionIcon type="button" variant="subtle" onClick={toggleColorScheme} size="lg">
						{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
					</ActionIcon>
				</Tooltip>

				<Button
					variant="light"
					size="compact-sm"
					leftSection={<MessageCircle size={16} />}
					onClick={handleOpenChat}
					aria-label="Open AI chat"
				>
					Ask AI
				</Button>
			</Group>
		</Group>
	)
}
