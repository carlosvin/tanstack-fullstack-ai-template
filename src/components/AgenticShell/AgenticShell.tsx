import {
	ActionIcon,
	AppShell,
	Box,
	Container,
	Group,
	Modal,
	Stack,
	Text,
	Tooltip,
	useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Moon, Sparkles, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AgenticComposer } from '@/components/AgenticShell/AgenticComposer'
import { AgenticThread } from '@/components/AgenticShell/AgenticThread'
import threadStyles from '@/components/AgenticShell/AgenticThread.module.css'
import { SettingsPage } from '@/components/SettingsPage/SettingsPage'
import { UserMenu } from '@/components/UserMenu/UserMenu'
import type { CurrentUser } from '@/services/schemas/schemas'
import type { AppMeta } from '@/services/schemas/shellSession'

interface AgenticShellProps {
	appMeta: AppMeta
	aiAvailable: boolean
	currentUser?: CurrentUser
}

const AGENTIC_FOOTER_MIN_HEIGHT = 76

/**
 * Fully agentic shell: product identity + User Menu, conversation stage,
 * bottom-pinned composer. No navbar, no domain routes, no stacked dashboard.
 * Settings opens an in-shell modal. Task views arrive as Mantine A2UI surfaces.
 */
export function AgenticShell({ appMeta, aiAvailable, currentUser }: AgenticShellProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const [footerHeight, setFooterHeight] = useState(AGENTIC_FOOTER_MIN_HEIGHT)
	const footerMeasureRef = useRef<HTMLDivElement>(null)
	const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false)

	useEffect(() => {
		if (!aiAvailable) return
		const el = footerMeasureRef.current
		if (!el) return

		const updateHeight = () => {
			const measured = Math.ceil(el.getBoundingClientRect().height)
			setFooterHeight(Math.max(AGENTIC_FOOTER_MIN_HEIGHT, measured))
		}

		updateHeight()
		const observer = new ResizeObserver(updateHeight)
		observer.observe(el)
		return () => observer.disconnect()
	}, [aiAvailable])

	const threadScrollHeight =
		'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-footer-height) - var(--app-shell-padding) * 2)'

	return (
		<>
			<AppShell
				header={{ height: 56 }}
				footer={aiAvailable ? { height: footerHeight } : undefined}
				padding={{ base: 'sm', sm: 'md' }}
			>
				<AppShell.Header>
					<Group h="100%" px="md" justify="space-between" wrap="nowrap">
						<Tooltip label={`${appMeta.name} v${appMeta.version}`}>
							<Group gap="xs" wrap="nowrap" miw={0}>
								<Sparkles size={20} />
								<Text fw={700} size="lg" truncate>
									{appMeta.name}
								</Text>
							</Group>
						</Tooltip>
						<Group gap="xs" wrap="nowrap">
							<Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
								<ActionIcon type="button" variant="subtle" onClick={toggleColorScheme} size="lg">
									{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
								</ActionIcon>
							</Tooltip>
							{currentUser ? <UserMenu currentUser={currentUser} onOpenSettings={openSettings} /> : null}
						</Group>
					</Group>
				</AppShell.Header>
				<AppShell.Main>
					{aiAvailable ? (
						<AgenticThread scrollHeight={threadScrollHeight} />
					) : (
						<Container size="sm" py="xl">
							<Stack gap="sm" align="center">
								<Text size="lg" fw={600} ta="center">
									AI is not configured
								</Text>
								<Text size="sm" c="dimmed" ta="center">
									This shell has no pages behind the prompt. Set an AI provider key to start.
								</Text>
							</Stack>
						</Container>
					)}
				</AppShell.Main>
				{aiAvailable ? (
					<AppShell.Footer p="xs" px={{ base: 'sm', sm: 'md' }}>
						<Box className={threadStyles.stage} ref={footerMeasureRef}>
							<AgenticComposer />
						</Box>
					</AppShell.Footer>
				) : null}
			</AppShell>
			{currentUser ? (
				<Modal opened={settingsOpened} onClose={closeSettings} title="Settings" size="md">
					<SettingsPage currentUser={currentUser} onSaved={closeSettings} />
				</Modal>
			) : null}
		</>
	)
}
