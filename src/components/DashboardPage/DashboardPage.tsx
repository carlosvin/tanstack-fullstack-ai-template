import { Badge, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { CheckCircle, Circle, Clock, ListTodo, type LucideIcon } from 'lucide-react'
import type { TASK_STATUSES } from '../../constants/options'
import type { Task } from '../../types'
import { priorityColor, statusColor } from '../../utils/taskDisplay'
import { Link } from '../Link/Link'

interface DashboardStat {
	label: string
	value: number
	icon: LucideIcon
	status?: (typeof TASK_STATUSES)[number]
	filterLabel: string
}

export interface DashboardPageProps {
	tasks: Task[]
	appName: string
	appVersion: string
	env?: string
}

function statusCount(tasks: Task[], status: string) {
	return tasks.filter((t) => t.status === status).length
}

export function DashboardPage({ tasks, appName, appVersion, env }: DashboardPageProps) {
	const stats: DashboardStat[] = [
		{
			label: 'Total',
			value: tasks.length,
			icon: ListTodo,
			filterLabel: 'View all tasks',
		},
		{
			label: 'Pending',
			value: statusCount(tasks, 'pending'),
			icon: Circle,
			status: 'pending',
			filterLabel: 'Filter tasks by pending status',
		},
		{
			label: 'In Progress',
			value: statusCount(tasks, 'in-progress'),
			icon: Clock,
			status: 'in-progress',
			filterLabel: 'Filter tasks by in progress status',
		},
		{
			label: 'Done',
			value: statusCount(tasks, 'done'),
			icon: CheckCircle,
			status: 'done',
			filterLabel: 'Filter tasks by done status',
		},
	]

	return (
		<Container size="lg" py={{ base: 'xs', sm: 'md' }} px={0}>
			<Stack gap="xl">
				<div>
					<Title order={2}>Dashboard</Title>
					<Group gap="xs" mt={4} wrap="wrap">
						<Text c="dimmed">Overview of your task management workspace.</Text>
						<Text size="sm" c="dimmed">
							{appName} v{appVersion}
						</Text>
						{env ? (
							<Badge size="sm" variant="light" color="gray">
								{env}
							</Badge>
						) : null}
					</Group>
				</div>

				<SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }}>
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
									<ThemeIcon
										variant="light"
										color={stat.status ? statusColor(stat.status) : 'blue'}
										size="lg"
										radius="md"
									>
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
									<Group justify="space-between" wrap="wrap" gap="xs">
										<Group gap="sm" wrap="wrap" miw={0} flex={1}>
											<Text fw={500} lineClamp={2}>
												{task.title}
											</Text>
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
