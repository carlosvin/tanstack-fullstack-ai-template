import { ActionIcon, Burger, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { CheckSquare, MessageCircle, Moon, Sun } from 'lucide-react'
import type { AppMeta } from '../../env/webEnv'
import { Link } from '../Link/Link'

interface HeaderProps {
	navOpened: boolean
	onToggleNav: () => void
	appMeta: AppMeta
	aiAvailable?: boolean
	onOpenChat?: () => void
}

/** Compact AppShell header: burger (mobile), brand, theme, and AI chat. */
export function Header({ navOpened, onToggleNav, appMeta, aiAvailable = false, onOpenChat }: HeaderProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const appTitle = appMeta.name

	const handleOpenChat = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		onOpenChat?.()
	}

	return (
		<Group h="100%" px="md" justify="space-between" wrap="nowrap">
			<Group gap="sm" wrap="nowrap" miw={0} flex={1}>
				<Burger opened={navOpened} onClick={onToggleNav} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
				<Link to="/" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
					<Tooltip label={`${appTitle} v${appMeta.version}`}>
						<Group gap="xs" wrap="nowrap" miw={0}>
							<CheckSquare size={20} />
							<Text fw={700} size="lg" truncate>
								{appTitle}
							</Text>
						</Group>
					</Tooltip>
				</Link>
			</Group>

			<Group gap="xs" wrap="nowrap">
				<Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
					<ActionIcon type="button" variant="subtle" onClick={toggleColorScheme} size="lg">
						{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
					</ActionIcon>
				</Tooltip>

				{aiAvailable ? (
					<Tooltip label="Ask AI">
						<ActionIcon type="button" variant="light" size="lg" onClick={handleOpenChat} aria-label="Open AI chat">
							<MessageCircle size={18} />
						</ActionIcon>
					</Tooltip>
				) : null}
			</Group>
		</Group>
	)
}
