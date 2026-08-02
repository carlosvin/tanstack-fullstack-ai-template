import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ShellSession } from '../../env/webEnv'
import type { CurrentUser } from '../../types'
import { ChatDrawer } from '../ChatDrawer/ChatDrawer'
import { Header } from '../Header/Header'

interface AppLayoutProps {
	currentUser?: CurrentUser
	shellSession: ShellSession
	aiAvailable?: boolean
	children: React.ReactNode
}

export function AppLayout({ currentUser, shellSession, aiAvailable = false, children }: AppLayoutProps) {
	const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false)

	return (
		<AppShell header={{ height: 52 }} padding="md">
			<AppShell.Header>
				<Header currentUser={currentUser} appMeta={shellSession.app} aiAvailable={aiAvailable} onOpenChat={openChat} />
			</AppShell.Header>
			<AppShell.Main>{children}</AppShell.Main>
			{aiAvailable ? <ChatDrawer opened={chatOpened} onClose={closeChat} /> : null}
		</AppShell>
	)
}
