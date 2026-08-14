import { AppShell, NavLink, ScrollArea, Text, Tooltip } from '@mantine/core'
import { Code, LayoutDashboard, ListTodo } from 'lucide-react'
import type { AppMeta } from '../../env/webEnv'
import type { CurrentUser } from '../../types'
import { Link } from '../Link/Link'

interface AppNavbarProps {
	pathname: string
	currentUser?: CurrentUser
	appMeta: AppMeta
	onNavigate?: () => void
}

function isDashboardActive(pathname: string) {
	return pathname === '/'
}

function isTasksActive(pathname: string) {
	return pathname === '/tasks' || pathname.startsWith('/tasks/')
}

/** Primary app navigation for AppShell.Navbar — overlay on mobile, pinned from `sm`. */
export function AppNavbar({ pathname, currentUser, appMeta, onNavigate }: AppNavbarProps) {
	const displayName = currentUser?.profile?.name || currentUser?.identity.name

	return (
		<>
			<AppShell.Section grow component={ScrollArea}>
				<NavLink
					component={Link}
					to="/"
					label="Dashboard"
					leftSection={<LayoutDashboard size={18} />}
					active={isDashboardActive(pathname)}
					onClick={onNavigate}
				/>
				<NavLink
					component={Link}
					to="/tasks"
					label="Tasks"
					leftSection={<ListTodo size={18} />}
					active={isTasksActive(pathname)}
					onClick={onNavigate}
				/>
			</AppShell.Section>
			<AppShell.Section>
				{displayName ? (
					<Tooltip
						label={`Demo test user (${currentUser?.identity.email}). Actions are attributed to this identity. Provide a real JWT in the auth header to use your own account.`}
						disabled={!currentUser?.isTestUser}
						multiline
						w={280}
					>
						<Text
							size="sm"
							c="dimmed"
							truncate
							px="sm"
							py="xs"
							style={currentUser?.isTestUser ? { cursor: 'help' } : undefined}
						>
							{displayName}
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
