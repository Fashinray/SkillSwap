import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Credits Ledger', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
  })

  test('credits page loads', async ({ page }) => {
    await page.goto('/credits')
    await expect(page.locator('text=Credit Ledger')).toBeVisible()
  })

  test('shows starter credit transaction', async ({ page }) => {
    await page.goto('/credits')
    await expect(page.locator('td').filter({ hasText: /^Starter credits$/ }).first()).toBeVisible({ timeout: 5000 })
  })

  test('balance is never negative', async ({ page }) => {
    await page.goto('/credits')
    const balanceEl = page.locator('text=Current balance').locator('..').locator('p').last()
    const text = await balanceEl.textContent()
    expect(Number(text?.trim())).toBeGreaterThanOrEqual(0)
  })
})
