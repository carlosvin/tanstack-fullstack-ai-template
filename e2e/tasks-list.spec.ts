import { expect, test } from '@playwright/test'
import { test as authedTest } from './auth'

test.describe('Task list', () => {
	test('shows tasks page with heading', async ({ page }) => {
		await page.goto('/tasks')

		await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
		await expect(page.getByText('Browse and filter all tasks.')).toBeVisible()

		const taskCards = page.locator('main').locator('[class*="Card"]')
		const count = await taskCards.count()
		expect(count).toBeGreaterThanOrEqual(4)
	})

	test('filters by status via URL', async ({ page }) => {
		await page.goto('/tasks?status=done')

		await expect(page.getByText('Set up project repository')).toBeVisible()
		await expect(page.getByText('Add dark mode support')).toBeVisible()
		await expect(page.getByText('Implement authentication')).not.toBeVisible()
	})

	test('filters by priority via URL', async ({ page }) => {
		await page.goto('/tasks?priority=high')

		await expect(page.getByText('Set up project repository')).toBeVisible()
		await expect(page.getByText('Design database schema')).toBeVisible()
		await expect(page.getByText('Implement authentication')).not.toBeVisible()
	})

	test('filters by search via URL', async ({ page }) => {
		await page.goto('/tasks?search=authentication')

		await expect(page.getByText('Implement authentication')).toBeVisible()
		await expect(page.getByText('Set up project repository')).not.toBeVisible()
	})

	test('filters overdue tasks by calendar date', async ({ page }) => {
		await page.goto('/tasks?due=overdue&asOf=2026-11-01')

		await expect(page.getByText('Design database schema')).toBeVisible()
		await expect(page.getByText('Implement authentication')).toBeVisible()
		await expect(page.getByText('Set up project repository')).not.toBeVisible()
	})

	test('filters by assignee via URL', async ({ page }) => {
		await page.goto('/tasks?assignee=alice@example.com')

		await expect(page.getByText('Set up project repository')).toBeVisible()
		await expect(page.getByText('Implement authentication')).toBeVisible()
		await expect(page.getByText('Design database schema')).not.toBeVisible()
	})

	authedTest('recovers bulk selection and bulk target status from URL', async ({ authedPage }) => {
		await authedPage.goto('/tasks?selected=task-1&selected=task-2&bulkStatus=in-progress')

		await expect(authedPage.getByText('2 selected')).toBeVisible()
		await expect(authedPage.getByRole('combobox', { name: 'Status for selected tasks' })).toHaveValue('In Progress')
	})

	test('combines multiple filters', async ({ page }) => {
		await page.goto('/tasks?status=pending&priority=critical')

		await expect(page.getByText('Implement authentication')).toBeVisible()
	})

	test('shows empty state when no results match', async ({ page }) => {
		await page.goto('/tasks?search=zzz-no-match-zzz')

		await expect(page.getByText('No tasks found matching your filters.')).toBeVisible()
	})

	test('visitors without a JWT are anonymous when AUTH_JWT_SECRET is configured', async ({ page }) => {
		// Playwright webServer sets AUTH_JWT_SECRET, so verified mode suppresses the demo cookie.
		await page.goto('/tasks')

		await expect(page.getByText('Anonymous')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Add task' })).toHaveCount(0)
	})
})
