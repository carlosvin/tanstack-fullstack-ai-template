import { ActionIcon, Button, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { CheckSquare, Code, ListTodo, MessageCircle, Moon, Sun } from 'lucide-react'
import type { AppMeta } from '../../env/webEnv'
import type { CurrentUser } from '../../types'
import { Link } from '../Link/Link'

interface HeaderProps {
	currentUser?: CurrentUser
	appMeta: AppMeta
	aiAvailable?: boolean
	onOpenChat?: () => void
}

/** Application header with navigation, color scheme toggle, and AI chat trigger. */
export function Header({ currentUser, appMeta, aiAvailable = false, onOpenChat }: HeaderProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const displayName = currentUser?.profile?.name || currentUser?.identity.name
	const appTitle = appMeta.name

	const handleOpenChat = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		onOpenChat?.()
	}

	return (
		<Group h="100%" px="md" justify="space-between">
			<Group gap="md">
				<Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
					<Tooltip label={`${appTitle} v${appMeta.version}`}>
						<Group gap="xs">
							<CheckSquare size={20} />
							<Text fw={700} size="lg">
								{appTitle}
							</Text>
						</Group>
					</Tooltip>
				</Link>

				<Link to="/tasks" style={{ textDecoration: 'none', color: 'inherit' }}>
					<Group gap={4}>
						<ListTodo size={16} />
						<Text size="sm">Tasks</Text>
					</Group>
				</Link>
			</Group>

			<Group gap="xs">
				{displayName ? (
					<Tooltip
						label={`Demo test user (${currentUser?.identity.email}). Actions are attributed to this identity. Provide a real JWT in the auth header to use your own account.`}
						disabled={!currentUser?.isTestUser}
						multiline
						w={280}
					>
						<Text size="sm" c="dimmed" style={currentUser?.isTestUser ? { cursor: 'help' } : undefined}>
							{displayName}
						</Text>
					</Tooltip>
				) : null}

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

				{aiAvailable ? (
					<Button
						variant="light"
						size="compact-sm"
						leftSection={<MessageCircle size={16} />}
						onClick={handleOpenChat}
						aria-label="Open AI chat"
					>
						Ask AI
					</Button>
				) : null}
			</Group>
		</Group>
	)
}
