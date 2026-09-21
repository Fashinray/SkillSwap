import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Matching Engine', () => {
  test('match page loads', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/match')
    await expect(page.locator('text=Find Your Skill Match')).toBeVisible()
  })

  test('match API returns valid response', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    // The match page now fetches server-side during render (Part B of the
    // redesign spec), so there's no client-side request to page.waitForResponse
    // on anymore. page.request shares the browser context's cookies from
    // loginAs, so the route's contract is verified by calling it directly.
    const response = await page.request.get('/api/match/compute')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('matches')
    expect(Array.isArray(body.matches)).toBe(true)
  })

  test('match scores are sorted descending and never NaN', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const response = await page.request.get('/api/match/compute')
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
    await page.waitForSelector('.match-card', { timeout: 15000 })
    // MatchCard renders "NN% Match" (see the header-band badge), not the
    // old card's literal "match score" label.
    await expect(page.locator('text=/\\d+% Match/').first()).toBeVisible({ timeout: 10000 })
  })

  test('request match button works', async ({ page }) => {
    await loginAs(page, 'emeka.nwosu@skillswap.test')
    await page.goto('/match')
    await page.waitForSelector('.match-card', { timeout: 15000 })
    // Button text is now "Request" (not "Request Match"); anchor the regex
    // so it doesn't also match "Requested" (a disabled <span>, not a button,
    // so getByRole wouldn't match it anyway, but keep this precise).
    const btn = page.getByRole('button', { name: /^Request$/i }).first()
    await expect(btn).toBeVisible({ timeout: 10000 })
    await btn.click()
    // Submitting revalidates the page server-side (no client-side toast),
    // so the same card's button flips to "Requested" once that completes.
    await expect(
      page.locator('text=Requested').or(page.locator('text=Match request sent')).first()
    ).toBeVisible({ timeout: 20000 })
  })
})
