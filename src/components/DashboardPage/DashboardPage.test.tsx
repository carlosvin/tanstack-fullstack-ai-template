import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/components/DashboardPage/DashboardPage'
import type { Task } from '@/services/schemas/schemas'
import { renderWithProviders } from '@/test-utils/renderWithRouter'

vi.mock('@/components/Link/Link', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const sampleTask: Task = {
	id: 'task-1',
	title: 'Set up project repository',
	status: 'done',
	priority: 'high',
	createdAt: '2025-01-15T09:00:00Z',
	updatedAt: '2025-01-16T14:30:00Z',
}

describe('DashboardPage', () => {
	it('renders the workspace title and a recent task', () => {
		renderWithProviders(<DashboardPage tasks={[sampleTask]} appName="TaskHub" appVersion="1.0.0" env="development" />)

		expect(screen.getByText('Dashboard')).toBeTruthy()
		expect(screen.getByText('Set up project repository')).toBeTruthy()
		expect(screen.getByText('TaskHub v1.0.0')).toBeTruthy()
	})
})
