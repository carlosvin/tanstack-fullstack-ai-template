import { expect, test } from '@playwright/test'

test.describe('Dashboard', () => {
	test('shows page title and description', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByText('Overview of your task management workspace.')).toBeVisible()
	})

	test('shows four stat cards', async ({ page }) => {
		await page.goto('/')

		await expect(page.getByText('Total').first()).toBeVisible()
		await expect(page.getByText('Pending').first()).toBeVisible()
		await expect(page.getByText('In Progress').first()).toBeVisible()
		await expect(page.getByText('Done').first()).toBeVisible()
	})

	test('stat tiles navigate to tasks with status filters', async ({ page }) => {
		await page.goto('/')

		await page.getByRole('link', { name: 'Filter tasks by pending status' }).click()
		await expect(page).toHaveURL(/\/tasks\?status=pending/)

		await page.goto('/')
		await page.getByRole('link', { name: 'Filter tasks by in progress status' }).click()
		await expect(page).toHaveURL(/\/tasks\?status=in-progress/)

		await page.goto('/')
		await page.getByRole('link', { name: 'Filter tasks by done status' }).click()
		await expect(page).toHaveURL(/\/tasks\?status=done/)

		await page.goto('/')
		await page.getByRole('link', { name: 'View all tasks' }).click()
		await expect(page).toHaveURL('/tasks')
	})

	test('shows recent tasks section', async ({ page }) => {
		await page.goto('/')

		await expect(page.getByRole('heading', { name: 'Recent Tasks' })).toBeVisible()

		const taskCards = page.locator('main').locator('[class*="Card"]')
		await expect(taskCards.first()).toBeVisible()
	})

	test('"View all" link navigates to /tasks', async ({ page }) => {
		await page.goto('/')
		await page.getByText('View all →').click()
		await expect(page).toHaveURL(/\/tasks/)
	})

	test('clicking a task navigates to task detail', async ({ page }) => {
		await page.goto('/')
		await page.getByText('Set up project repository').click()
		await expect(page).toHaveURL(/\/tasks\/task-1/)
	})
})
