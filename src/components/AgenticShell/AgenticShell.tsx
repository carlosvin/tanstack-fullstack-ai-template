import { ActionIcon, AppShell, Box, Container, Group, Stack, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { Moon, Sparkles, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AppMeta } from '../../services/schemas/shellSession'
import { AgenticComposer } from './AgenticComposer'
import { AgenticThread } from './AgenticThread'
import threadStyles from './AgenticThread.module.css'

interface AgenticShellProps {
	appMeta: AppMeta
	aiAvailable: boolean
}

const AGENTIC_FOOTER_MIN_HEIGHT = 76

/**
 * Fully agentic shell: identity header, conversation stage, bottom-pinned
 * composer. No navbar, no domain routes, no stacked dashboard. Task views
 * arrive as Mantine A2UI surfaces. Raw HTML arrives as a sandboxed MCP UI resource.
 */
export function AgenticShell({ appMeta, aiAvailable }: AgenticShellProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const [footerHeight, setFooterHeight] = useState(AGENTIC_FOOTER_MIN_HEIGHT)
	const footerMeasureRef = useRef<HTMLDivElement>(null)

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
					<Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
						<ActionIcon type="button" variant="subtle" onClick={toggleColorScheme} size="lg">
							{colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
						</ActionIcon>
					</Tooltip>
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
	)
}
