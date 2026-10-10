import type { ServerToClientMessage, UserAction } from '@a2ui-bridge/core'
import { Surface, useA2uiProcessor } from '@a2ui-bridge/react'
import { Alert, Button, Paper, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { mantineTaskCatalog } from '../../services/a2ui/mantineCatalog'
import { acceptA2uiMessages } from '../../services/a2ui/taskViewMessages'

interface AgenticA2uiSurfaceProps {
	messages: ServerToClientMessage[]
	onAction: (action: UserAction) => void
	onRetry?: () => void
}

/**
 * Host renderer for a Mantine A2UI task view.
 * Messages are catalog-checked before they reach the processor.
 * Unknown component types render nothing.
 */
export function AgenticA2uiSurface({ messages, onAction, onRetry }: AgenticA2uiSurfaceProps) {
	const processor = useA2uiProcessor()
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		try {
			processor.clearSurfaces()
			processor.processMessages(acceptA2uiMessages(messages))
			setFailed(false)
		} catch {
			setFailed(true)
		}
	}, [messages, processor])

	if (failed) {
		return (
			<Alert color="yellow" title="View unavailable">
				<Stack gap="xs">
					<Text size="sm">
						This interactive view failed validation and was not rendered. The text answer above still applies.
					</Text>
					{onRetry ? (
						<Button variant="light" size="compact-sm" onClick={onRetry}>
							Retry
						</Button>
					) : null}
				</Stack>
			</Alert>
		)
	}

	return (
		<Paper withBorder radius="md" p="sm" data-testid="task-view">
			<Surface processor={processor} components={mantineTaskCatalog} onAction={onAction} />
		</Paper>
	)
}
