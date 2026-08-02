import { Badge, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { CheckCircle, Circle, Clock, ListTodo } from 'lucide-react'
import { Link } from '../components/Link/Link'
import type { TASK_STATUSES } from '../constants/options'
import { getTasks } from '../services/api/serverFns'
import type { Task } from '../types'

export const Route = createFileRoute('/')({
	loader: () => getTasks({}),
	component: DashboardPage,
})

function statusCount(tasks: Task[], status: string) {
	return tasks.filter((t) => t.status === status).length
}

function DashboardPage() {
	const tasks = Route.useLoaderData()
	const { shellSession } = useLoaderData({ from: '__root__' })

	const stats: Array<{
		label: string
		value: number
		icon: typeof ListTodo
		color: string
		status?: (typeof TASK_STATUSES)[number]
		filterLabel: string
	}> = [
		{
			label: 'Total',
			value: tasks.length,
			icon: ListTodo,
			color: 'blue',
			filterLabel: 'View all tasks',
		},
		{
			label: 'Pending',
			value: statusCount(tasks, 'pending'),
			icon: Circle,
			color: 'yellow',
			status: 'pending',
			filterLabel: 'Filter tasks by pending status',
		},
		{
			label: 'In Progress',
			value: statusCount(tasks, 'in-progress'),
			icon: Clock,
			color: 'teal',
			status: 'in-progress',
			filterLabel: 'Filter tasks by in progress status',
		},
		{
			label: 'Done',
			value: statusCount(tasks, 'done'),
			icon: CheckCircle,
			color: 'green',
			status: 'done',
			filterLabel: 'Filter tasks by done status',
		},
	]

	return (
		<Container size="lg" py="md">
			<Stack gap="xl">
				<div>
					<Title order={2}>Dashboard</Title>
					<Group gap="xs" mt={4}>
						<Text c="dimmed">Overview of your task management workspace.</Text>
						<Text size="sm" c="dimmed">
							{shellSession.app.name} v{shellSession.app.version}
						</Text>
						{shellSession.ENV ? (
							<Badge size="sm" variant="light" color="gray">
								{shellSession.ENV}
							</Badge>
						) : null}
					</Group>
				</div>

				<SimpleGrid cols={{ base: 2, sm: 4 }}>
					{stats.map((stat) => (
						<Link
							key={stat.label}
							to="/tasks"
							search={stat.status ? { status: stat.status } : {}}
							aria-label={stat.filterLabel}
							style={{ textDecoration: 'none', color: 'inherit' }}
						>
							<Card
								withBorder
								padding="lg"
								style={{ cursor: 'pointer' }}
								styles={{
									root: {
										transition: 'border-color 150ms ease, box-shadow 150ms ease',
										'&:hover': {
											borderColor: 'var(--mantine-color-gray-4)',
											boxShadow: 'var(--mantine-shadow-sm)',
										},
									},
								}}
							>
								<Group justify="space-between" align="flex-start">
									<div>
										<Text size="xs" c="dimmed" tt="uppercase" fw={700}>
											{stat.label}
										</Text>
										<Title order={2} mt={4}>
											{stat.value}
										</Title>
									</div>
									<ThemeIcon variant="light" color={stat.color} size="lg" radius="md">
										<stat.icon size={20} />
									</ThemeIcon>
								</Group>
							</Card>
						</Link>
					))}
				</SimpleGrid>

				<div>
					<Group justify="space-between" mb="md">
						<Title order={3}>Recent Tasks</Title>
						<Link to="/tasks" style={{ textDecoration: 'none' }}>
							<Text size="sm" c="teal">
								View all →
							</Text>
						</Link>
					</Group>
					<Stack gap="xs">
						{tasks.slice(0, 5).map((task) => (
							<Link
								key={task.id}
								to="/tasks/$taskId"
								params={{ taskId: task.id }}
								style={{ textDecoration: 'none', color: 'inherit' }}
							>
								<Card withBorder padding="sm">
									<Group justify="space-between">
										<Group gap="sm">
											<Text fw={500}>{task.title}</Text>
											<Badge size="sm" variant="light" color={priorityColor(task.priority)}>
												{task.priority}
											</Badge>
										</Group>
										<Badge variant="dot" color={statusColor(task.status)}>
											{task.status}
										</Badge>
									</Group>
								</Card>
							</Link>
						))}
					</Stack>
				</div>
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
