import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/renderWithRouter'
import { AgenticPromptMarkdownLink } from './AgenticPromptMarkdownLink'

describe('AgenticPromptMarkdownLink', () => {
	it('uses the follow-up prompt when a task link has no label', () => {
		renderWithProviders(<AgenticPromptMarkdownLink href="/tasks/task-1" onPrompt={vi.fn()} />)
		expect(screen.getByRole('button', { name: 'Show task task-1' })).toBeTruthy()
	})
})
