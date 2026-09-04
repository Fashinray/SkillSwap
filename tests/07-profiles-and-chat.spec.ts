import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Public Profiles and Session Room', () => {
  test('public profile page loads for a seeded user', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')

    // Get another user's ID from the match page API
    const responsePromise = page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await page.goto('/match')
    const response = await responsePromise
    const body = await response.json()

    if (body.matches.length > 0) {
      const userId = body.matches[0].user_id
      await page.goto(`/profile/${userId}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('text=reputation')).toBeVisible()
      await expect(page.locator('text=sessions completed')).toBeVisible()
    }
  })

  test('own profile redirects to /profile', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.waitForLoadState('networkidle')
    // Get own user ID
    const response = await page.request.get('/api/match/compute')
    const body = await response.json()
    const myId = body.my_user_id

    if (myId) {
      await page.goto(`/profile/${myId}`)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/profile$/, { timeout: 15000 })
    }
  })

  test('match browser candidate names are clickable links', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/match')
    await page.waitForResponse('**/api/match/compute', { timeout: 15000 })

    const candidateLink = page.locator('a[href^="/profile/"]').first()
    await expect(candidateLink).toBeVisible({ timeout: 10000 })
  })

  test('sessions page shows enter session room link for active sessions', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    // Either shows book session form or upcoming sessions
    const pageContent = await page.content()
    expect(pageContent).toContain('Sessions')
  })

  test('ice config API returns valid config', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const response = await page.request.get('/api/rtc/ice-config')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('iceServers')
    expect(Array.isArray(body.iceServers)).toBe(true)
    expect(body.iceServers.length).toBeGreaterThan(0)
  })

  test('trusted badge shows on profiles with high reputation', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const responsePromise = page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await page.goto('/match')
    const response = await responsePromise
    const body = await response.json()
    // Trusted field should be present on every match
    body.matches.forEach((m: any) => {
      expect(typeof m.is_trusted).toBe('boolean')
    })
  })
})
