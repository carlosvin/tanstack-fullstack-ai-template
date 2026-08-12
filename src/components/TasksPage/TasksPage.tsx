import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Container,
	Flex,
	Group,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import type { Task, TaskFilter } from '../../types'
import { priorityColor, statusColor } from '../../utils/taskDisplay'
import { Link } from '../Link/Link'

export interface TasksPageProps {
	tasks: Task[]
	search: TaskFilter
	isAuth: boolean
	currentUserEmail?: string
	onUpdateSearch: (updates: Partial<TaskFilter>, replace?: boolean) => void
	onDeleteTask: (task: Task) => void
}

export function TasksPage({ tasks, search, isAuth, currentUserEmail, onUpdateSearch, onDeleteTask }: TasksPageProps) {
	const urlSearch = search.search ?? ''

	const debouncedSearch = useDebouncedCallback((value: string) => {
		const next = value || undefined
		if (next === search.search) return
		onUpdateSearch({ search: next }, true)
	}, 300)

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
						<Link to="/tasks/new" search={{}} style={{ textDecoration: 'none' }}>
							<Button leftSection={<Plus size={16} />}>Add task</Button>
						</Link>
					)}
				</Group>

				<Flex gap="sm" align="flex-end">
					<TextInput
						placeholder="Search tasks..."
						leftSection={<Search size={16} />}
						defaultValue={urlSearch}
						onChange={(e) => debouncedSearch(e.currentTarget.value)}
						flex={1}
					/>
					<Select
						placeholder="Status"
						clearable
						data={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
						value={search.status ?? null}
						onChange={(val) => onUpdateSearch({ status: (val as (typeof TASK_STATUSES)[number]) || undefined })}
						w={150}
					/>
					<Select
						placeholder="Priority"
						clearable
						data={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
						value={search.priority ?? null}
						onChange={(val) => onUpdateSearch({ priority: (val as (typeof TASK_PRIORITIES)[number]) || undefined })}
						w={150}
					/>
				</Flex>

				{tasks.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No tasks found matching your filters.
					</Text>
				) : (
					<Stack gap="xs">
						{tasks.map((task) => {
							const isCreator = isAuth && task.createdBy === currentUserEmail
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
											<Group gap={4}>
												<Link
													to="/tasks/$taskId/edit"
													params={{ taskId: task.id }}
													search={{}}
													style={{ textDecoration: 'none' }}
												>
													<ActionIcon variant="subtle" size="sm" aria-label="Edit task">
														<Pencil size={14} />
													</ActionIcon>
												</Link>
												<ActionIcon
													variant="subtle"
													size="sm"
													color="red"
													aria-label="Delete task"
													onClick={() => onDeleteTask(task)}
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
		</Container>
	)
}
