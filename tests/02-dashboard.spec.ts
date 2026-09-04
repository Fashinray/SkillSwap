import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
  })

  test('shows credit balance', async ({ page }) => {
    await expect(page.locator('text=Credit Balance')).toBeVisible()
  })

  test('shows reputation score', async ({ page }) => {
    await expect(page.locator('text=Reputation Score')).toBeVisible()
  })

  test('has navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /find match/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /credits/i }).first()).toBeVisible()
  })

  test('seeded user has 5 or more credits', async ({ page }) => {
    const creditCard = page.locator('text=Credit Balance').locator('..')
    const balance = creditCard.locator('p').nth(1)
    const text = await balance.textContent()
    expect(Number(text?.trim())).toBeGreaterThanOrEqual(5)
  })
})
