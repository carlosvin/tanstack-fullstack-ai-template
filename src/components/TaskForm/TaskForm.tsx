import { Button, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { useEffect } from 'react'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { TaskInputSchema } from '../../services/schemas/schemas'
import type { TaskInput } from '../../types'

const taskFormSchema = TaskInputSchema.extend({
	title: TaskInputSchema.shape.title.min(1, { error: 'Title is required' }),
})

const defaultValues: TaskInput = {
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

function toFormValues(initialValues?: Partial<TaskInput>): TaskInput {
	return {
		title: initialValues?.title ?? defaultValues.title,
		description: initialValues?.description ?? defaultValues.description,
		status: initialValues?.status ?? defaultValues.status,
		priority: initialValues?.priority ?? defaultValues.priority,
		assignee: initialValues?.assignee ?? defaultValues.assignee,
	}
}

/** Reusable form for creating and editing tasks. */
export function TaskForm({ initialValues, onSubmit, loading = false, submitLabel = 'Save' }: TaskFormProps) {
	const form = useForm({
		mode: 'uncontrolled',
		initialValues: toFormValues(initialValues),
		validate: schemaResolver(taskFormSchema, { sync: true }),
	})

	useEffect(() => {
		form.setValues(toFormValues(initialValues))
	}, [
		initialValues?.title,
		initialValues?.description,
		initialValues?.status,
		initialValues?.priority,
		initialValues?.assignee,
		form.setValues,
		initialValues,
	])

	const handleSubmit = form.onSubmit((values) => {
		onSubmit({
			...values,
			title: values.title.trim(),
			description: values.description?.trim() || undefined,
			assignee: values.assignee?.trim() || undefined,
		})
	})

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="md">
				<TextInput
					label="Title"
					placeholder="Task title"
					key={form.key('title')}
					{...form.getInputProps('title')}
					required
				/>
				<Textarea
					label="Description"
					placeholder="Optional description"
					minRows={2}
					key={form.key('description')}
					{...form.getInputProps('description')}
				/>
				<Select
					label="Status"
					data={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
					key={form.key('status')}
					{...form.getInputProps('status')}
				/>
				<Select
					label="Priority"
					data={TASK_PRIORITIES.map((p) => ({ value: p, label: p }))}
					key={form.key('priority')}
					{...form.getInputProps('priority')}
				/>
				<TextInput
					label="Assignee"
					placeholder="Email (optional)"
					key={form.key('assignee')}
					{...form.getInputProps('assignee')}
				/>
				<Button type="submit" loading={loading}>
					{submitLabel}
				</Button>
			</Stack>
		</form>
	)
}
