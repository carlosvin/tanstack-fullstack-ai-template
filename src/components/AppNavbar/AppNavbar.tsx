import { AppShell, NavLink, ScrollArea, Text } from '@mantine/core'
import { Code, LayoutDashboard, ListTodo, Sparkles } from 'lucide-react'
import { Link } from '@/components/Link/Link'
import type { AppMeta, PromptConcept } from '@/services/schemas/shellSession'

interface AppNavbarProps {
	pathname: string
	appMeta: AppMeta
	promptConcept?: PromptConcept
	onNavigate?: () => void
}

/** Primary nav only — identity / Settings live in the header User Menu. */
export function AppNavbar({ pathname, appMeta, promptConcept = 'side', onNavigate }: AppNavbarProps) {
	const isPromptFirst = promptConcept === 'prompt-first'

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
