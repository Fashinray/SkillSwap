import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Matching Engine', () => {
  test('match page loads', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/match')
    await expect(page.locator('text=Find a Match')).toBeVisible()
  })

  test('match API returns valid response', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const responsePromise = page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await page.goto('/match')
    const response = await responsePromise
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('matches')
    expect(Array.isArray(body.matches)).toBe(true)
  })

  test('match scores are sorted descending and never NaN', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const responsePromise = page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await page.goto('/match')
    const response = await responsePromise
    const body = await response.json()
    body.matches.forEach((m: any) => {
      expect(isNaN(m.score)).toBe(false)
      expect(m.score).toBeGreaterThanOrEqual(0)
      expect(m.score).toBeLessThanOrEqual(1)
    })
    for (let i = 0; i < body.matches.length - 1; i++) {
      expect(body.matches[i].score).toBeGreaterThanOrEqual(body.matches[i + 1].score)
    }
  })

  test('candidates show with match scores', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/match')
    await page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await expect(page.locator('text=match score').first()).toBeVisible({ timeout: 10000 })
  })

  test('request match button works', async ({ page }) => {
    await loginAs(page, 'emeka.nwosu@skillswap.test')
    await page.goto('/match')
    await page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    const btn = page.getByRole('button', { name: /request match/i }).first()
    await expect(btn).toBeVisible({ timeout: 10000 })
    await btn.click()
    await expect(
      page.locator('text=Requested').or(page.locator('text=Match request sent')).first()
    ).toBeVisible({ timeout: 8000 })
  })
})
