import { Alert, Button, Container, Stack, Title } from '@mantine/core'
import { useRouter } from '@tanstack/react-router'
import { Home } from 'lucide-react'

interface ErrorDisplayProps {
	error: Error
}

/** Generic error display component used as the router's errorComponent. */
export function ErrorDisplay({ error }: ErrorDisplayProps) {
	const router = useRouter()

	return (
		<Container size="sm" py="xl">
			<Stack align="center" gap="lg">
				<Title order={2}>Something went wrong</Title>
				<Alert variant="light" color="red" title="Error" w="100%">
					{error.message || 'An unexpected error occurred.'}
				</Alert>
				<Button leftSection={<Home size={16} />} onClick={() => router.navigate({ to: '/' })}>
					Back to Home
				</Button>
			</Stack>
		</Container>
	)
}
