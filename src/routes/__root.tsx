import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@/styles.css'
import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, redirect, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { ErrorDisplay } from '@/components/ErrorDisplay/ErrorDisplay'
import { NotFoundPage } from '@/components/NotFoundPage/NotFoundPage'
import { getAIAvailability, getBrowserShellSession, getCurrentUser } from '@/services/api/serverFns'
import { watchNetlifyHud } from '@/utils/netlifyHud'

export const Route = createRootRoute({
	beforeLoad: async ({ location }) => {
		// One shell-session fetch for the guard and the loader (avoids a second round trip).
		const shellSession = await getBrowserShellSession()
		// Agentic deployments have no domain screens — keep the shell on `/`.
		if (
			shellSession.promptConcept === 'agentic' &&
			!location.pathname.startsWith('/api/') &&
			location.pathname !== '/'
		) {
			throw redirect({ to: '/' })
		}
		return { shellSession }
	},
	loader: async ({ context }) => {
		const [currentUser, aiAvailability] = await Promise.all([getCurrentUser(), getAIAvailability()])
		return {
			currentUser,
			shellSession: context.shellSession,
			aiAvailable: aiAvailability.available,
		}
	},
	head: ({ loaderData }) => {
		const appName = loaderData?.shellSession.app.name ?? 'TaskHub'
		return {
			meta: [
				{ charSet: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ title: `${appName} — Full-Stack Template` },
			],
		}
	},
	shellComponent: RootDocument,
	errorComponent: ErrorDisplay,
	notFoundComponent: NotFoundPage,
})

/**
 * Mantine theme configuration.
 * Customize the primary color, fonts, and component defaults here.
 */
const theme = createTheme({
	primaryColor: 'teal',
	defaultRadius: 'md',
	fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	components: {
		Paper: { defaultProps: { radius: 'md' } },
		Card: { defaultProps: { radius: 'md' } },
		Button: { defaultProps: { radius: 'md' } },
		Badge: { defaultProps: { radius: 'sm' } },
	},
})

function RootDocument({ children }: { children: React.ReactNode }) {
	const { currentUser, shellSession, aiAvailable } = Route.useLoaderData()
	useEffect(() => watchNetlifyHud(document), [])

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ColorSchemeScript defaultColorScheme="auto" />
				<HeadContent />
			</head>
			<body>
				<MantineProvider defaultColorScheme="auto" theme={theme}>
					<ModalsProvider>
						<Notifications position="top-right" />
						<AppLayout currentUser={currentUser} shellSession={shellSession} aiAvailable={aiAvailable}>
							{children}
						</AppLayout>
					</ModalsProvider>
				</MantineProvider>
				<TanStackDevtools
					config={{ position: 'bottom-right' }}
					plugins={[{ name: 'Router', render: <TanStackRouterDevtoolsPanel /> }]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
