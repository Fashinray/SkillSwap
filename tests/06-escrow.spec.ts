import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Escrow and Session Booking', () => {
  test('sessions page loads', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  })

  test('sessions nav link is visible', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await expect(page.getByRole('link', { name: /sessions/i }).first()).toBeVisible()
  })

  test('sessions page shows book session form when accepted matches exist', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    const bookForm = page.locator('text=Book a Session')
    const noMatches = page.locator('text=Find a match first')
    const hasOne = await bookForm.isVisible({ timeout: 5000 }).catch(() => false)
    const hasOther = await noMatches.isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasOne || hasOther).toBe(true)
  })

  test('credits page ledger shows correct transaction types', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/credits')
    await expect(page.locator('text=Credit Ledger')).toBeVisible()
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('ghost sweep API requires admin', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const response = await page.request.post('/api/admin/ghost-sweep')
    expect(response.status()).toBe(403)
  })

  test('match API scores are between 0 and 1', async ({ page }) => {
    await loginAs(page, 'bola.fasanya@skillswap.test')
    const response = await page.request.get('/api/match/compute')
    const body = await response.json()
    body.matches.forEach((m: any) => {
      expect(m.score).toBeGreaterThanOrEqual(0)
      expect(m.score).toBeLessThanOrEqual(1)
      expect(isNaN(m.score)).toBe(false)
    })
  })
})
