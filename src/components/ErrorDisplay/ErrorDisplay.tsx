import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, Home } from 'lucide-react'

interface ErrorDisplayProps {
	error: Error
}

/** Generic error display component used as the router's errorComponent. */
export function ErrorDisplay({ error }: ErrorDisplayProps) {
	const router = useRouter()

	return (
		<Container size="sm" py="xl">
			<Stack align="center" gap="lg" ta="center">
				<AlertTriangle size={48} />
				<Title order={2}>Something went wrong</Title>
				<Text c="dimmed">{error.message || 'An unexpected error occurred.'}</Text>
				<Button leftSection={<Home size={16} />} onClick={() => router.navigate({ to: '/' })}>
					Back to Home
				</Button>
			</Stack>
		</Container>
	)
}
