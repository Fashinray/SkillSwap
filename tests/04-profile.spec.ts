import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/profile')
  })

  test('profile page loads', async ({ page }) => {
    await expect(page.locator('text=Your Profile')).toBeVisible()
  })

  test('skill selector shows available skills', async ({ page }) => {
    const countText = page.locator('text=/\\d+ skills available/')
    await expect(countText).toBeVisible({ timeout: 5000 })
    const text = await countText.textContent()
    const count = parseInt(text?.match(/(\d+)/)?.[1] ?? '0')
    expect(count).toBeGreaterThan(0)
  })

  test('seeded user has teach skills listed', async ({ page }) => {
    await expect(page.locator('text=Skills I can teach')).toBeVisible()
    const list = page.locator('text=Skills I can teach').locator('..').locator('li').first()
    await expect(list).toBeVisible({ timeout: 5000 })
  })

  test('bio textarea is editable', async ({ page }) => {
    const bio = page.locator('textarea[name="bio"]')
    await bio.clear()
    await bio.fill('Testing bio update')
    expect(await bio.inputValue()).toBe('Testing bio update')
  })
})
