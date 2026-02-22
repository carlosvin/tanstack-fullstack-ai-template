import { Badge, Card, Container, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { getTasks } from '../../services/api/serverFns'

const TasksSearchSchema = z.object({
	status: z.enum(TASK_STATUSES).optional(),
	priority: z.enum(TASK_PRIORITIES).optional(),
	search: z.string().optional(),
})

export const Route = createFileRoute('/tasks/')({
	validateSearch: TasksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getTasks({ data: deps }),
	component: TasksPage,
})

function TasksPage() {
	const tasks = Route.useLoaderData()
	const search = Route.useSearch()
	const navigate = useNavigate()

	const updateSearch = (updates: Partial<z.infer<typeof TasksSearchSchema>>) => {
		navigate({
			to: '/tasks',
			search: (prev) => ({ ...prev, ...updates }),
		})
	}

	return (
		<Container size="lg" py="md">
			<Stack gap="lg">
				<div>
					<Title order={2}>Tasks</Title>
					<Text c="dimmed" mt={4}>
						Browse and filter all tasks.
					</Text>
				</div>

				<Group gap="sm">
					<TextInput
						placeholder="Search tasks..."
						leftSection={<Search size={16} />}
						value={search.search ?? ''}
						onChange={(e) => updateSearch({ search: e.currentTarget.value || undefined })}
						style={{ flex: 1 }}
					/>
					<Select
						placeholder="Status"
						clearable
						data={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
						value={search.status ?? null}
						onChange={(val) => updateSearch({ status: (val as (typeof TASK_STATUSES)[number]) || undefined })}
						w={150}
					/>
					<Select
						placeholder="Priority"
						clearable
						data={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
						value={search.priority ?? null}
						onChange={(val) => updateSearch({ priority: (val as (typeof TASK_PRIORITIES)[number]) || undefined })}
						w={150}
					/>
				</Group>

				{tasks.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No tasks found matching your filters.
					</Text>
				) : (
					<Stack gap="xs">
						{tasks.map((task) => (
							<Link
								key={task.id}
								to="/tasks/$taskId"
								params={{ taskId: task.id }}
								style={{ textDecoration: 'none', color: 'inherit' }}
							>
								<Card withBorder padding="md">
									<Group justify="space-between" wrap="nowrap">
										<Stack gap={2} style={{ flex: 1 }}>
											<Group gap="sm">
												<Text fw={500}>{task.title}</Text>
												<Badge size="sm" variant="light" color={priorityColor(task.priority)}>
													{task.priority}
												</Badge>
											</Group>
											{task.description && (
												<Text size="sm" c="dimmed" lineClamp={1}>
													{task.description}
												</Text>
											)}
										</Stack>
										<Group gap="sm" wrap="nowrap">
											{task.assignee && (
												<Text size="xs" c="dimmed">
													{task.assignee}
												</Text>
											)}
											<Badge variant="dot" color={statusColor(task.status)}>
												{task.status}
											</Badge>
										</Group>
									</Group>
								</Card>
							</Link>
						))}
					</Stack>
				)}
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
