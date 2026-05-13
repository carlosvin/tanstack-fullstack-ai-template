import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect } from 'react'
import type { WebPublicEnv } from '../../env/webEnv'
import { getObservability } from '../../services/observability'
import type { UserIdentity, UserProfile } from '../../types'
import { ChatDrawer } from '../ChatDrawer/ChatDrawer'
import { Header } from '../Header/Header'

interface AppLayoutProps {
	currentUser?: { identity: UserIdentity; profile: UserProfile | null }
	publicEnv?: WebPublicEnv
	children: React.ReactNode
}

export function AppLayout({ currentUser, publicEnv, children }: AppLayoutProps) {
	const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false)

	useEffect(() => {
		if (publicEnv) getObservability({ publicEnv })
	}, [publicEnv])

	return (
		<AppShell header={{ height: 52 }} padding="md">
			<AppShell.Header>
				<Header currentUser={currentUser} onOpenChat={openChat} />
			</AppShell.Header>
			<AppShell.Main>{children}</AppShell.Main>
			<ChatDrawer opened={chatOpened} onClose={closeChat} />
		</AppShell>
	)
}
