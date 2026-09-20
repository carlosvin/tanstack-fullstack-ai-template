import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
	it('renders tools-layer fields from TaskInputSchema', () => {
		renderWithProviders(<TaskForm onSubmit={vi.fn()} submitLabel="Create" />)

		expect(screen.getByPlaceholderText('Task title')).toBeTruthy()
		expect(screen.getByPlaceholderText('Optional description')).toBeTruthy()
		expect(screen.getByRole('combobox', { name: 'Status' })).toBeTruthy()
		expect(screen.getByRole('combobox', { name: 'Priority' })).toBeTruthy()
		expect(screen.getByPlaceholderText('Email (optional)')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy()
	})

	it('rejects whitespace-only titles before calling onSubmit', () => {
		const onSubmit = vi.fn()
		renderWithProviders(<TaskForm onSubmit={onSubmit} submitLabel="Create" />)

		fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: '   ' } })
		fireEvent.submit(screen.getByRole('button', { name: 'Create' }).closest('form') as HTMLFormElement)

		expect(onSubmit).not.toHaveBeenCalled()
		expect(screen.getByText('Title is required')).toBeTruthy()
	})
})
