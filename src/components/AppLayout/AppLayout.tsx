import { AppShell, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { ShellSession } from '../../services/schemas/shellSession'
import type { CurrentUser } from '../../types'
import { AppNavbar } from '../AppNavbar/AppNavbar'
import { ChatDrawer } from '../ChatDrawer/ChatDrawer'
import { Header } from '../Header/Header'
import { PromptBar } from '../PromptBar/PromptBar'
import { PromptChatProvider } from '../PromptChat/PromptChatContext'

interface AppLayoutProps {
	currentUser?: CurrentUser
	shellSession: ShellSession
	aiAvailable?: boolean
	children: React.ReactNode
}

/**
 * Prompt concept from `shellSession.promptConcept` (promptable-ux skill):
 * - **Promptable UI (side)** (`side`) — ChatDrawer hidden until the header opens it
 * - **Prompt-first** (`prompt-first`) — always-visible PromptBar above page content
 *
 * One chat shell per deployment; `PROMPT_CONCEPT` selects the branch.
 */
export function AppLayout({ currentUser, shellSession, aiAvailable = false, children }: AppLayoutProps) {
	const promptConcept = shellSession.promptConcept
	const isSideConcept = promptConcept === 'side'
	const isPromptFirst = promptConcept === 'prompt-first'

	const [chatOpened, { open: openChatDrawer, close: closeChat }] = useDisclosure(false)
	const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false)
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const previousPathname = useRef(pathname)

	useEffect(() => {
		if (previousPathname.current === pathname) return
		previousPathname.current = pathname
		closeNav()
	}, [pathname, closeNav])

	const openChat = () => {
		closeNav()
		openChatDrawer()
	}

	const shell = (
		<AppShell
			header={{ height: 56 }}
			navbar={{
				width: 240,
				breakpoint: 'sm',
				collapsed: { mobile: !navOpened },
			}}
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
				<AppNavbar pathname={pathname} currentUser={currentUser} appMeta={shellSession.app} onNavigate={closeNav} />
			</AppShell.Navbar>
			<AppShell.Main>
				<Stack gap="md">
					{isPromptFirst && aiAvailable ? <PromptBar /> : null}
					{children}
				</Stack>
			</AppShell.Main>
			{isSideConcept && aiAvailable ? <ChatDrawer opened={chatOpened} onClose={closeChat} /> : null}
		</AppShell>
	)

	if (aiAvailable) {
		return <PromptChatProvider>{shell}</PromptChatProvider>
	}

	return shell
}
