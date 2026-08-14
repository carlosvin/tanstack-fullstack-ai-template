import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { useRouter } from '@tanstack/react-router'
import { Home } from 'lucide-react'

/** Shared 404 page used by the root route and router defaults bundle. */
export function NotFoundPage() {
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
