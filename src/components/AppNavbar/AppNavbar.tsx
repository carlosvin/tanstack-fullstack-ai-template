import { AppShell, NavLink, ScrollArea, Text, Tooltip } from '@mantine/core'
import { Code, LayoutDashboard, ListTodo } from 'lucide-react'
import type { AppMeta } from '../../services/schemas/shellSession'
import type { CurrentUser } from '../../types'
import { Link } from '../Link/Link'

interface AppNavbarProps {
	pathname: string
	currentUser?: CurrentUser
	appMeta: AppMeta
	onNavigate?: () => void
}

export function AppNavbar({ pathname, currentUser, appMeta, onNavigate }: AppNavbarProps) {
	return (
		<>
			<AppShell.Section grow component={ScrollArea}>
				<NavLink
					component={Link}
					to="/"
					label="Dashboard"
					leftSection={<LayoutDashboard size={18} />}
					active={pathname === '/'}
					onClick={onNavigate}
				/>
				<NavLink
					component={Link}
					to="/tasks"
					label="Tasks"
					leftSection={<ListTodo size={18} />}
					active={pathname === '/tasks' || pathname.startsWith('/tasks/')}
					onClick={onNavigate}
				/>
			</AppShell.Section>
			<AppShell.Section>
				{currentUser ? (
					<Tooltip
						label={`Demo test user (${currentUser.identity.email}). Actions are attributed to this identity. Provide a real JWT in the auth header to use your own account.`}
						disabled={!currentUser.isTestUser}
						multiline
						w={280}
					>
						<Text
							size="sm"
							c="dimmed"
							truncate
							px="sm"
							py="xs"
							style={currentUser.isTestUser ? { cursor: 'help' } : undefined}
						>
							{currentUser.profile?.name || currentUser.identity.name}
						</Text>
					</Tooltip>
				) : null}
				<NavLink
					component="a"
					href="https://github.com/carlosvin/tanstack-fullstack-ai-template"
					target="_blank"
					rel="noopener noreferrer"
					label="View source"
					leftSection={<Code size={18} />}
				/>
				<Text size="xs" c="dimmed" px="sm" pt="xs">
					{appMeta.name} v{appMeta.version}
				</Text>
			</AppShell.Section>
		</>
	)
}
