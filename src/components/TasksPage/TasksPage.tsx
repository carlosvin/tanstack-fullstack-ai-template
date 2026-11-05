import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Checkbox,
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
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { Link } from '@/components/Link/Link'
import { MAX_BULK_TASK_SELECTION } from '@/constants/options'
import {
	type AssigneeOption,
	OptionalTaskPrioritySchema,
	OptionalTaskStatusSchema,
	type Task,
	TaskDueFilterSchema,
	type TaskStatus,
	type TasksListSearch,
} from '@/services/schemas/schemas'
import { formatCalendarDate } from '@/utils/calendarDate'
import {
	priorityColor,
	priorityLabel,
	prioritySelectOptions,
	statusColor,
	statusLabel,
	statusSelectOptions,
} from '@/utils/taskDisplay'
import { isTaskOverdue } from '@/utils/taskDue'

const DUE_OPTIONS = [
	{ value: 'overdue', label: 'Overdue' },
	{ value: 'scheduled', label: 'Has a due date' },
	{ value: 'unscheduled', label: 'No due date' },
]

export interface TasksPageProps {
	tasks: Task[]
	assignees: AssigneeOption[]
	search: TasksListSearch
	isAuth: boolean
	isTestUser: boolean
	today: string
	currentUserEmail?: string
	bulkLoading?: boolean
	onUpdateSearch: (updates: Partial<TasksListSearch>, replace?: boolean) => void
	onDeleteTask: (task: Task) => void
	onBulkStatus: (status: TaskStatus) => void
}

function idsHiddenFrom(selected: readonly string[], visibleIds: readonly string[]): string[] {
	const visible = new Set(visibleIds)
	return selected.filter((id) => !visible.has(id))
}

/** Visible ids that fit with the hidden selection, in list order, up to {@link MAX_BULK_TASK_SELECTION}. */
function visibleSelectionTarget(selected: readonly string[], visibleIds: readonly string[]): string[] {
	const hidden = idsHiddenFrom(selected, visibleIds)
	const target: string[] = []
	for (const id of visibleIds) {
		if (hidden.length + target.length >= MAX_BULK_TASK_SELECTION) break
		if (!target.includes(id)) target.push(id)
	}
	return target
}

/** Keep ids outside the current result. Add or remove only the capped visible ids. */
function selectionAfterVisibleToggle(
	selected: readonly string[],
	visibleIds: readonly string[],
	selectAll: boolean,
): string[] {
	const hidden = idsHiddenFrom(selected, visibleIds)
	if (!selectAll) return hidden
	return [...hidden, ...visibleSelectionTarget(selected, visibleIds)]
}

export function TasksPage({
	tasks,
	assignees,
	search,
	isAuth,
	isTestUser,
	today,
	currentUserEmail,
	bulkLoading = false,
	onUpdateSearch,
	onDeleteTask,
	onBulkStatus,
}: TasksPageProps) {
	const selected = search.selected ?? []
	const selectedSet = useMemo(() => new Set(selected), [selected])
	const visibleIds = useMemo(() => tasks.map((task) => task.id), [tasks])
	const visibleTarget = useMemo(() => visibleSelectionTarget(selected, visibleIds), [selected, visibleIds])
	const allVisibleSelected = visibleTarget.length > 0 && visibleTarget.every((id) => selectedSet.has(id))
	const selectVisibleLabel =
		visibleIds.length > visibleTarget.length
			? `Select visible (${visibleTarget.length} of ${visibleIds.length})`
			: 'Select visible'
	const assigneeOptions = useMemo(
		() =>
			assignees.map((option) => ({
				value: option.email,
				label: option.name ? `${option.name} (${option.email})` : option.email,
			})),
		[assignees],
	)
	const assigneeNames = useMemo(
		() => new Map(assignees.flatMap((option) => (option.name ? [[option.email, option.name] as const] : []))),
		[assignees],
	)
	const mine = Boolean(currentUserEmail) && search.assignee === currentUserEmail
	const [bulkStatus, setBulkStatus] = useState<TaskStatus>('done')

	const debouncedSearch = useDebouncedCallback((value: string) => {
		const next = value || undefined
		if (next === search.search) return
		onUpdateSearch({ search: next }, true)
	}, 300)

	return (
		<Container size="lg" py={{ base: 'xs', sm: 'md' }} px={0}>
			<Stack gap="lg">
				<Flex
					justify="space-between"
					align={{ base: 'stretch', sm: 'flex-end' }}
					gap="sm"
					direction={{ base: 'column', sm: 'row' }}
				>
					<div>
						<Title order={2}>Tasks</Title>
						<Text c="dimmed" mt={4}>
							Browse and filter all tasks.
						</Text>
					</div>
					{isAuth && (
						<Link to="/tasks/new" search={{}} style={{ textDecoration: 'none' }}>
							<Button leftSection={<Plus size={16} />} w={{ base: '100%', sm: 'auto' }}>
								Add task
							</Button>
						</Link>
					)}
				</Flex>

				<Flex gap="sm" align="flex-end" direction={{ base: 'column', sm: 'row' }} wrap="wrap">
					<TextInput
						placeholder="Search tasks..."
						leftSection={<Search size={16} />}
						defaultValue={search.search ?? ''}
						onChange={(e) => debouncedSearch(e.currentTarget.value)}
						w={{ base: '100%', sm: 'auto' }}
						flex={1}
					/>
					<Select
						placeholder="Status"
						clearable
						data={statusSelectOptions}
						value={search.status ?? null}
						onChange={(val) => onUpdateSearch({ status: OptionalTaskStatusSchema.parse(val) })}
						w={{ base: '100%', sm: 150 }}
					/>
					<Select
						placeholder="Priority"
						clearable
						data={prioritySelectOptions}
						value={search.priority ?? null}
						onChange={(val) => onUpdateSearch({ priority: OptionalTaskPrioritySchema.parse(val) })}
						w={{ base: '100%', sm: 150 }}
					/>
					<Select
						placeholder="Due"
						aria-label="Due"
						clearable
						data={DUE_OPTIONS}
						value={search.due ?? null}
						onChange={(val) => {
							const due = TaskDueFilterSchema.optional().parse(val ?? undefined)
							onUpdateSearch({ due, asOf: due === 'overdue' ? today : undefined })
						}}
						w={{ base: '100%', sm: 170 }}
					/>
					<Select
						placeholder="Assignee"
						aria-label="Assignee"
						clearable
						data={assigneeOptions}
						value={search.assignee ?? null}
						onChange={(val) =>
							onUpdateSearch({
								assignee: z
									.string()
									.min(1)
									.optional()
									.parse(val ?? undefined),
							})
						}
						w={{ base: '100%', sm: 220 }}
					/>
					{isAuth && !isTestUser && currentUserEmail ? (
						<Button
							variant={mine ? 'filled' : 'light'}
							onClick={() => onUpdateSearch({ assignee: mine ? undefined : currentUserEmail })}
							w={{ base: '100%', sm: 'auto' }}
						>
							Assigned to me
						</Button>
					) : null}
				</Flex>

				{isAuth && tasks.length > 0 ? (
					<Flex
						gap="sm"
						align={{ base: 'stretch', sm: 'center' }}
						direction={{ base: 'column', sm: 'row' }}
						wrap="wrap"
					>
						<Checkbox
							label={selectVisibleLabel}
							checked={allVisibleSelected}
							onChange={() => {
								const next = selectionAfterVisibleToggle(selected, visibleIds, !allVisibleSelected)
								onUpdateSearch({ selected: next.length > 0 ? next : undefined }, true)
							}}
						/>
						{selected.length > 0 ? (
							<Group gap="sm" align="flex-end" wrap="wrap">
								<Text size="sm" c="dimmed">
									{selected.length} selected
								</Text>
								<Select
									aria-label="Status for selected tasks"
									data={statusSelectOptions}
									value={bulkStatus}
									w={{ base: '100%', sm: 160 }}
									onChange={(value) => {
										const parsed = OptionalTaskStatusSchema.parse(value)
										if (parsed) setBulkStatus(parsed)
									}}
								/>
								<Button loading={bulkLoading} onClick={() => onBulkStatus(bulkStatus)}>
									Update status
								</Button>
							</Group>
						) : null}
					</Flex>
				) : null}

				{tasks.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No tasks found matching your filters.
					</Text>
				) : (
					<Stack gap="xs">
						{tasks.map((task) => {
							const isCreator = isAuth && task.createdBy === currentUserEmail
							const overdue = isTaskOverdue(task, search.asOf ?? today)
							return (
								<Card key={task.id} withBorder padding="md">
									<Group justify="space-between" wrap="wrap" gap="sm">
										{isAuth ? (
											<Checkbox
												aria-label={`Select ${task.title}`}
												checked={selectedSet.has(task.id)}
												onChange={() => {
													const next = selectedSet.has(task.id)
														? selected.filter((id) => id !== task.id)
														: selected.length >= MAX_BULK_TASK_SELECTION
															? selected
															: [...selected, task.id]
													if (next === selected) return
													onUpdateSearch({ selected: next.length > 0 ? next : undefined }, true)
												}}
											/>
										) : null}
										<Link
											to="/tasks/$taskId"
											params={{ taskId: task.id }}
											style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
										>
											<Group justify="space-between" wrap="wrap" gap="xs">
												<Stack gap={2} miw={0} flex={1}>
													<Group gap="sm" wrap="wrap">
														<Text fw={500} lineClamp={2}>
															{task.title}
														</Text>
														<Badge size="sm" variant="light" color={priorityColor(task.priority)}>
															{priorityLabel(task.priority)}
														</Badge>
													</Group>
													{task.description && (
														<Text size="sm" c="dimmed" lineClamp={1}>
															{task.description}
														</Text>
													)}
												</Stack>
												<Group gap="sm" wrap="wrap">
													{task.assignee && (
														<Text size="xs" c="dimmed">
															{assigneeNames.get(task.assignee) ?? task.assignee}
														</Text>
													)}
													{task.dueDate ? (
														<Text size="xs" c={overdue ? 'red' : 'dimmed'}>
															{overdue ? 'Overdue' : 'Due'} {formatCalendarDate(task.dueDate)}
														</Text>
													) : null}
													<Badge variant="dot" color={statusColor(task.status)}>
														{statusLabel(task.status)}
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
