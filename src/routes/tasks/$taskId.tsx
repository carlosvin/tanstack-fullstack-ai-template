import { Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Pencil, Trash2, User } from 'lucide-react'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getCurrentUser, getTask } from '../../services/api/serverFns'

export const Route = createFileRoute('/tasks/$taskId')({
	loader: async ({ params }) => {
		const [task, currentUser] = await Promise.all([getTask({ data: { taskId: params.taskId } }), getCurrentUser()])
		return { task, currentUser }
	},
	component: TaskDetailPage,
})

function TaskDetailPage() {
	const { task, currentUser } = Route.useLoaderData()
	const router = useRouter()
	const isCreator = Boolean(task && currentUser?.identity?.email && task.createdBy === currentUser.identity.email)

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

	const handleDeleteClick = () => {
		if (!window.confirm(`Delete "${task.title}"?`)) return
		processResponse(() => deleteTask({ data: { taskId: task.id } })).then((result) => {
			if (result.error) {
				notifications.show({ message: result.error.message, color: 'red' })
				return
			}
			notifications.show({ message: 'Task deleted', color: 'green' })
			router.navigate({ to: '/tasks' })
		})
	}

	return (
		<Container size="md" py="md">
			<Stack gap="lg">
				<Group justify="space-between">
					<Link to="/tasks" style={{ textDecoration: 'none' }}>
						<Button variant="subtle" leftSection={<ArrowLeft size={16} />} size="sm">
							Back to Tasks
						</Button>
					</Link>
					{isCreator && (
						<Group gap="xs">
							<Button
								variant="light"
								leftSection={<Pencil size={14} />}
								size="sm"
								onClick={() =>
									router.navigate({
										to: '/tasks/$taskId/edit',
										params: { taskId: task.id },
									})
								}
							>
								Edit
							</Button>
							<Button
								variant="light"
								color="red"
								leftSection={<Trash2 size={14} />}
								size="sm"
								onClick={handleDeleteClick}
							>
								Delete
							</Button>
						</Group>
					)}
				</Group>

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
			<Outlet />
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
