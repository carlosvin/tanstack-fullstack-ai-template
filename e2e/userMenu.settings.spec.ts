import { expect, test } from '@playwright/test'

/**
 * Smoke: User Menu in the header opens Settings (side/prompt-first).
 * Relies on the demo test-auth cookie minted when no JWT is present.
 */
test.describe('User Menu and Settings', () => {
	test('avatar menu opens Settings page', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('button', { name: 'Open user menu' })).toBeVisible()
		await page.getByRole('button', { name: 'Open user menu' }).click()
		await expect(page.getByText('Settings').first()).toBeVisible()
		await page.getByText('Settings').first().click()
		await expect(page).toHaveURL(/\/settings/)
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
		await expect(page.getByText('Color scheme')).toBeVisible()
		await page.getByRole('combobox', { name: /color scheme/i }).click()
		await page.getByRole('option', { name: 'Dark' }).click()
		await page.getByRole('button', { name: 'Save preferences' }).click()
		await expect(page.getByText('Preferences saved')).toBeVisible()
	})
})
