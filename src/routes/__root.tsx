import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '../styles.css'
import { Button, ColorSchemeScript, Container, createTheme, MantineProvider, Stack, Text, Title } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Home } from 'lucide-react'
import { AppLayout } from '../components/AppLayout/AppLayout'
import { ErrorDisplay } from '../components/ErrorDisplay/ErrorDisplay'
import { getCurrentUser } from '../services/api/serverFns'

export const Route = createRootRoute({
	loader: async () => {
		const currentUser = await getCurrentUser()
		return { currentUser }
	},
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'TaskHub — Full-Stack Template' },
		],
	}),
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

function NotFoundPage() {
	const router = useRouter()

	return (
		<Container size="sm" py="xl">
			<Stack align="center" gap="lg" ta="center">
				<Title order={1} size="6rem" c="dimmed">
					404
				</Title>
				<Title order={2}>Page Not Found</Title>
				<Text c="dimmed" size="lg">
					The page you're looking for doesn't exist or has been moved.
				</Text>
				<Button leftSection={<Home size={16} />} onClick={() => router.navigate({ to: '/' })}>
					Back to Home
				</Button>
			</Stack>
		</Container>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<ColorSchemeScript defaultColorScheme="auto" />
				<HeadContent />
			</head>
			<body>
				<MantineProvider defaultColorScheme="auto" theme={theme}>
					<Notifications position="top-right" />
					<AppLayout currentUser={Route.useLoaderData()?.currentUser}>{children}</AppLayout>
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
