import { AppShell, NavLink, ScrollArea, Text } from '@mantine/core'
import { Code, LayoutDashboard, ListTodo, Settings, Sparkles } from 'lucide-react'
import { Link } from '@/components/Link/Link'
import type { CurrentUser } from '@/services/schemas/schemas'
import type { AppMeta, PromptConcept } from '@/services/schemas/shellSession'

interface AppNavbarProps {
	pathname: string
	currentUser?: CurrentUser
	appMeta: AppMeta
	promptConcept?: PromptConcept
	onNavigate?: () => void
}

export function AppNavbar({ pathname, currentUser, appMeta, promptConcept = 'side', onNavigate }: AppNavbarProps) {
	const isPromptFirst = promptConcept === 'prompt-first'
	const displayName = currentUser ? currentUser.profile?.name || currentUser.identity.name : null

	return (
		<>
			<AppShell.Section grow component={ScrollArea}>
				<NavLink
					component={Link}
					to="/"
					label={isPromptFirst ? 'AI Assistant' : 'Dashboard'}
					leftSection={isPromptFirst ? <Sparkles size={18} /> : <LayoutDashboard size={18} />}
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
					<NavLink
						component={Link}
						to="/settings"
						label={displayName || 'Settings'}
						description={currentUser.isTestUser ? 'Demo identity · Settings' : 'Settings'}
						leftSection={<Settings size={18} />}
						active={pathname === '/settings'}
						onClick={onNavigate}
					/>
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
