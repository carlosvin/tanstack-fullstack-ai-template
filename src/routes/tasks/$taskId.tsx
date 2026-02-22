import { Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { getTask } from '../../services/api/serverFns'

export const Route = createFileRoute('/tasks/$taskId')({
	loader: ({ params }) => getTask(params.taskId),
	component: TaskDetailPage,
})

function TaskDetailPage() {
	const task = Route.useLoaderData()
	const router = useRouter()

	if (!task) {
		return (
			<Container size="sm" py="xl">
				<Stack align="center" gap="md">
					<Title order={3}>Task not found</Title>
					<Button
						variant="subtle"
						leftSection={<ArrowLeft size={16} />}
						onClick={() => router.navigate({ to: '/tasks' })}
					>
						Back to Tasks
					</Button>
				</Stack>
			</Container>
		)
	}

	return (
		<Container size="md" py="md">
			<Stack gap="lg">
				<Link to="/tasks" style={{ textDecoration: 'none' }}>
					<Button variant="subtle" leftSection={<ArrowLeft size={16} />} size="sm">
						Back to Tasks
					</Button>
				</Link>

				<Card withBorder padding="xl">
					<Stack gap="md">
						<Group justify="space-between" align="flex-start">
							<div>
								<Title order={2}>{task.title}</Title>
								<Text size="xs" c="dimmed" mt={4}>
									ID: {task.id}
								</Text>
							</div>
							<Group gap="sm">
								<Badge variant="dot" color={statusColor(task.status)} size="lg">
									{task.status}
								</Badge>
								<Badge variant="light" color={priorityColor(task.priority)} size="lg">
									{task.priority}
								</Badge>
							</Group>
						</Group>

						{task.description && <Text>{task.description}</Text>}

						<Group gap="xl" mt="md">
							{task.assignee && (
								<Group gap="xs">
									<User size={16} />
									<Text size="sm">{task.assignee}</Text>
								</Group>
							)}
							<Group gap="xs">
								<Calendar size={16} />
								<Text size="sm" c="dimmed">
									Created: {new Date(task.createdAt).toLocaleDateString()}
								</Text>
							</Group>
							<Group gap="xs">
								<Calendar size={16} />
								<Text size="sm" c="dimmed">
									Updated: {new Date(task.updatedAt).toLocaleDateString()}
								</Text>
							</Group>
						</Group>
					</Stack>
				</Card>
			</Stack>
		</Container>
	)
}

function statusColor(status: string): string {
	const map: Record<string, string> = {
		pending: 'yellow',
		'in-progress': 'teal',
		done: 'green',
		cancelled: 'gray',
	}
	return map[status] ?? 'gray'
}

function priorityColor(priority: string): string {
	const map: Record<string, string> = {
		low: 'gray',
		medium: 'blue',
		high: 'orange',
		critical: 'red',
	}
	return map[priority] ?? 'gray'
}
