import { Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { ArrowLeft, Calendar, Pencil, Trash2, User } from 'lucide-react'
import type { Task } from '../../types'
import { priorityColor, statusColor } from '../../utils/taskDisplay'
import { Link } from '../Link/Link'

export interface TaskDetailPageProps {
	task: Task | null
	isCreator: boolean
	onEdit: () => void
	onDelete: () => void
}

export function TaskDetailPage({ task, isCreator, onEdit, onDelete }: TaskDetailPageProps) {
	if (!task) {
		return (
			<Container size="sm" py="xl">
				<Stack align="center" gap="md">
					<Title order={3}>Task not found</Title>
					<Link to="/tasks" style={{ textDecoration: 'none' }}>
						<Button variant="subtle" leftSection={<ArrowLeft size={16} />}>
							Back to Tasks
						</Button>
					</Link>
				</Stack>
			</Container>
		)
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
							<Button variant="light" leftSection={<Pencil size={14} />} size="sm" onClick={onEdit}>
								Edit
							</Button>
							<Button variant="light" color="red" leftSection={<Trash2 size={14} />} size="sm" onClick={onDelete}>
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
		</Container>
	)
}
