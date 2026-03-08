import { Button, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useEffect, useState } from 'react'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import type { TaskInput } from '../../types'

export interface TaskFormValues {
	title: string
	description: string
	status: (typeof TASK_STATUSES)[number]
	priority: (typeof TASK_PRIORITIES)[number]
	assignee: string
}

const defaultValues: TaskFormValues = {
	title: '',
	description: '',
	status: 'pending',
	priority: 'medium',
	assignee: '',
}

interface TaskFormProps {
	initialValues?: Partial<TaskInput>
	onSubmit: (values: TaskInput) => void | Promise<void>
	loading?: boolean
	submitLabel?: string
}

/** Reusable form for creating and editing tasks. */
export function TaskForm({ initialValues, onSubmit, loading = false, submitLabel = 'Save' }: TaskFormProps) {
	const values: TaskFormValues = {
		title: initialValues?.title ?? defaultValues.title,
		description: initialValues?.description ?? defaultValues.description,
		status: (initialValues?.status as TaskFormValues['status']) ?? defaultValues.status,
		priority: (initialValues?.priority as TaskFormValues['priority']) ?? defaultValues.priority,
		assignee: initialValues?.assignee ?? defaultValues.assignee,
	}

	const [formTitle, setFormTitle] = useState(values.title)
	const [formDescription, setFormDescription] = useState(values.description)
	const [formStatus, setFormStatus] = useState<string | null>(values.status)
	const [formPriority, setFormPriority] = useState<string | null>(values.priority)
	const [formAssignee, setFormAssignee] = useState(values.assignee)

	// Sync when initialValues change (e.g. edit modal opened with different task)
	useEffect(() => {
		setFormTitle(values.title)
		setFormDescription(values.description)
		setFormStatus(values.status)
		setFormPriority(values.priority)
		setFormAssignee(values.assignee)
	}, [values.title, values.description, values.status, values.priority, values.assignee])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!formTitle.trim()) return
		onSubmit({
			title: formTitle.trim(),
			description: formDescription.trim() || undefined,
			status: (formStatus as TaskInput['status']) ?? 'pending',
			priority: (formPriority as TaskInput['priority']) ?? 'medium',
			assignee: formAssignee.trim() || undefined,
		})
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="md">
				<TextInput
					label="Title"
					placeholder="Task title"
					value={formTitle}
					onChange={(e) => setFormTitle(e.currentTarget.value)}
					required
				/>
				<Textarea
					label="Description"
					placeholder="Optional description"
					value={formDescription}
					onChange={(e) => setFormDescription(e.currentTarget.value)}
					minRows={2}
				/>
				<Select
					label="Status"
					data={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
					value={formStatus}
					onChange={setFormStatus}
				/>
				<Select
					label="Priority"
					data={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
					value={formPriority}
					onChange={setFormPriority}
				/>
				<TextInput
					label="Assignee"
					placeholder="Email (optional)"
					value={formAssignee}
					onChange={(e) => setFormAssignee(e.currentTarget.value)}
				/>
				<Button type="submit" loading={loading} disabled={!formTitle.trim()}>
					{submitLabel}
				</Button>
			</Stack>
		</form>
	)
}
