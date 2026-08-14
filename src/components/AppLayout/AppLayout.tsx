import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { ShellSession } from '../../env/webEnv'
import type { CurrentUser } from '../../types'
import { AppNavbar } from '../AppNavbar/AppNavbar'
import { ChatDrawer } from '../ChatDrawer/ChatDrawer'
import { Header } from '../Header/Header'

interface AppLayoutProps {
	currentUser?: CurrentUser
	shellSession: ShellSession
	aiAvailable?: boolean
	children: React.ReactNode
}

export function AppLayout({ currentUser, shellSession, aiAvailable = false, children }: AppLayoutProps) {
	const [chatOpened, { open: openChatDrawer, close: closeChat }] = useDisclosure(false)
	const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false)
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const router = useRouter()

	useEffect(() => {
		return router.subscribe('onResolved', () => {
			closeNav()
		})
	}, [router, closeNav])

	const openChat = () => {
		closeNav()
		openChatDrawer()
	}

	return (
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
					onOpenChat={openChat}
				/>
			</AppShell.Header>
			<AppShell.Navbar p="md">
				<AppNavbar pathname={pathname} currentUser={currentUser} appMeta={shellSession.app} onNavigate={closeNav} />
			</AppShell.Navbar>
			<AppShell.Main>{children}</AppShell.Main>
			{aiAvailable ? <ChatDrawer opened={chatOpened} onClose={closeChat} /> : null}
		</AppShell>
	)
}
