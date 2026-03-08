import { expect, test } from '@playwright/test'

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
		await expect(page.getByText('Design database schema')).not.toBeVisible()
	})

	test('combines multiple filters', async ({ page }) => {
		await page.goto('/tasks?status=pending&priority=critical')

		await expect(page.getByText('Implement authentication')).toBeVisible()
	})

	test('shows empty state when no results match', async ({ page }) => {
		await page.goto('/tasks?search=zzz-no-match-zzz')

		await expect(page.getByText('No tasks found matching your filters.')).toBeVisible()
	})

	test('anonymous user does not see Add task button or edit/delete icons', async ({ page }) => {
		await page.goto('/tasks')

		await expect(page.getByRole('button', { name: 'Add task' })).not.toBeVisible()
		await expect(page.getByLabel('Edit task').first()).not.toBeVisible()
		await expect(page.getByLabel('Delete task').first()).not.toBeVisible()
	})
})
