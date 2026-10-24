import { AppShell, Container } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { AgenticChatProvider } from '@/components/AgenticChat/AgenticChatContext'
import { AgenticShell } from '@/components/AgenticShell/AgenticShell'
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import { ChatDrawer } from '@/components/ChatDrawer/ChatDrawer'
import { Header } from '@/components/Header/Header'
import { PromptBar } from '@/components/PromptBar/PromptBar'
import { PromptChatProvider } from '@/components/PromptChat/PromptChatContext'
import type { CurrentUser } from '@/services/schemas/schemas'
import type { ShellSession } from '@/services/schemas/shellSession'

interface AppLayoutProps {
	currentUser?: CurrentUser
	shellSession: ShellSession
	aiAvailable?: boolean
	children: React.ReactNode
}

const PROMPT_FIRST_FOOTER_MIN_HEIGHT = 72

/**
 * Prompt concept from `shellSession.promptConcept` (promptable-ux + agentic-ux skills):
 * - **Promptable UI (side)** (`side`) — ChatDrawer hidden until the header opens it
 * - **Prompt-first** (`prompt-first`) — clean agentic conversation with bottom-pinned composer
 * - **Fully agentic** (`agentic`) — thin tool-only shell, no domain routes (agentic-ux skill)
 *
 * One chat shell per deployment; `PROMPT_CONCEPT` selects the branch.
 */
export function AppLayout({ currentUser, shellSession, aiAvailable = false, children }: AppLayoutProps) {
	const promptConcept = shellSession.promptConcept
	const isSideConcept = promptConcept === 'side'
	const isPromptFirst = promptConcept === 'prompt-first'
	const isAgentic = promptConcept === 'agentic'

	const showPromptFirstFooter = isPromptFirst && aiAvailable

	const [chatOpened, { open: openChatDrawer, close: closeChat }] = useDisclosure(false)
	const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false)
	const [footerHeight, setFooterHeight] = useState(PROMPT_FIRST_FOOTER_MIN_HEIGHT)
	const footerMeasureRef = useRef<HTMLDivElement>(null)
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const previousPathname = useRef(pathname)

	useEffect(() => {
		if (previousPathname.current === pathname) return
		previousPathname.current = pathname
		closeNav()
	}, [pathname, closeNav])

	useEffect(() => {
		if (!showPromptFirstFooter) return
		const el = footerMeasureRef.current
		if (!el) return

		const updateHeight = () => {
			const measured = Math.ceil(el.getBoundingClientRect().height)
			setFooterHeight(Math.max(PROMPT_FIRST_FOOTER_MIN_HEIGHT, measured))
		}

		updateHeight()
		const observer = new ResizeObserver(updateHeight)
		observer.observe(el)
		return () => observer.disconnect()
	}, [showPromptFirstFooter])

	const openChat = () => {
		closeNav()
		openChatDrawer()
	}

	if (isAgentic) {
		return (
			<AgenticChatProvider>
				<AgenticShell appMeta={shellSession.app} aiAvailable={aiAvailable} />
			</AgenticChatProvider>
		)
	}

	const shell = (
		<AppShell
			header={{ height: 56 }}
			navbar={{
				width: 240,
				breakpoint: 'sm',
				collapsed: { mobile: !navOpened },
			}}
			footer={showPromptFirstFooter ? { height: footerHeight } : undefined}
			padding={{ base: 'sm', sm: 'md' }}
		>
			<AppShell.Header>
				<Header
					navOpened={navOpened}
					onToggleNav={toggleNav}
					appMeta={shellSession.app}
					aiAvailable={aiAvailable}
					promptConcept={promptConcept}
					onOpenChat={isSideConcept ? openChat : undefined}
				/>
			</AppShell.Header>
			<AppShell.Navbar p="md">
				<AppNavbar
					pathname={pathname}
					currentUser={currentUser}
					appMeta={shellSession.app}
					promptConcept={promptConcept}
					onNavigate={closeNav}
				/>
			</AppShell.Navbar>
			<AppShell.Main>{children}</AppShell.Main>
			{showPromptFirstFooter ? (
				<AppShell.Footer p="xs" px={{ base: 'xs', sm: 'md' }}>
					<div ref={footerMeasureRef}>
						<Container size="md" p={0}>
							<PromptBar />
						</Container>
					</div>
				</AppShell.Footer>
			) : null}
			{isSideConcept && aiAvailable ? <ChatDrawer opened={chatOpened} onClose={closeChat} /> : null}
		</AppShell>
	)

	if (aiAvailable) {
		return <PromptChatProvider>{shell}</PromptChatProvider>
	}

	return shell
}
