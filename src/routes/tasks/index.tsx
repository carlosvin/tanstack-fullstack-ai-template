import { ActionIcon, Badge, Button, Card, Container, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { processResponse } from '../../services/api/processResponse'
import { deleteTask, getCurrentUser, getTasks } from '../../services/api/serverFns'
import type { Task } from '../../types'

const TasksSearchSchema = z.object({
	status: z.enum(TASK_STATUSES).optional(),
	priority: z.enum(TASK_PRIORITIES).optional(),
	search: z.string().optional(),
})

export const Route = createFileRoute('/tasks/')({
	validateSearch: TasksSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		const [tasks, currentUser] = await Promise.all([getTasks({ data: deps }), getCurrentUser()])
		return { tasks, currentUser }
	},
	component: TasksPage,
})

function TasksPage() {
	const { tasks, currentUser } = Route.useLoaderData()
	const search = Route.useSearch()
	const navigate = useNavigate()
	const isAuth = Boolean(currentUser?.identity?.email)

	const updateSearch = (updates: Partial<z.infer<typeof TasksSearchSchema>>) => {
		navigate({
			to: '/tasks',
			search: (prev) => ({ ...prev, ...updates }),
		})
	}

	const handleDeleteClick = (task: Task) => {
		if (!window.confirm(`Delete "${task.title}"?`)) return
		processResponse(() => deleteTask({ data: { taskId: task.id } })).then((result) => {
			if (result.error) {
				notifications.show({ message: result.error.message, color: 'red' })
				return
			}
			notifications.show({ message: 'Task deleted', color: 'green' })
		})
	}

	return (
		<Container size="lg" py="md">
			<Stack gap="lg">
				<Group justify="space-between" align="flex-end">
					<div>
						<Title order={2}>Tasks</Title>
						<Text c="dimmed" mt={4}>
							Browse and filter all tasks.
						</Text>
					</div>
					{isAuth && (
						<Button leftSection={<Plus size={16} />} onClick={() => navigate({ to: '/tasks/new' })}>
							Add task
						</Button>
					)}
				</Group>

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
						{tasks.map((task) => {
							const isCreator = isAuth && task.createdBy === currentUser?.identity?.email
							return (
								<Card key={task.id} withBorder padding="md">
									<Group justify="space-between" wrap="nowrap">
										<Link
											to="/tasks/$taskId"
											params={{ taskId: task.id }}
											style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
										>
											<Group justify="space-between" wrap="nowrap">
												<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
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
										</Link>
										{isCreator && (
											<Group gap={4} onClick={(e) => e.preventDefault()}>
												<ActionIcon
													variant="subtle"
													size="sm"
													aria-label="Edit task"
													onClick={() =>
														navigate({
															to: '/tasks/$taskId/edit',
															params: { taskId: task.id },
														})
													}
												>
													<Pencil size={14} />
												</ActionIcon>
												<ActionIcon
													variant="subtle"
													size="sm"
													color="red"
													aria-label="Delete task"
													onClick={() => handleDeleteClick(task)}
												>
													<Trash2 size={14} />
												</ActionIcon>
											</Group>
										)}
									</Group>
								</Card>
							)
						})}
					</Stack>
				)}
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
