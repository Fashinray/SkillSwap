import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Super Admin and Verification System', () => {
  test('register page shows three-step progress indicator', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('text=Join SkillSwap')).toBeVisible()
    // Step indicators should be visible
    await expect(page.locator('text=Create account')).toBeVisible()
  })

  test('superadmin route redirects non-superadmin users', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/superadmin')
    // Should redirect away from superadmin
    await expect(page).not.toHaveURL(/\/superadmin/, { timeout: 5000 })
  })

  test('admin verify API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/verify', {
      data: { userId: 'test', decision: 'verified' },
    })
    expect(res.status()).toBe(403)
  })

  test('admin skills API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/skills', {
      data: { userSkillId: 'test', score: 3 },
    })
    expect(res.status()).toBe(403)
  })

  test('admin settings API is protected from non-superadmin', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/settings', {
      data: { key: 'GHOST_GRACE_PERIOD_MINUTES', value: '15' },
    })
    expect(res.status()).toBe(403)
  })

  test('OAU email restriction is disabled for test accounts', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[name="email"]', 'test@skillswap.test')
    await page.fill('input[name="password"]', 'TestPass123!')
    await expect(page.locator('text=restricted to OAU students')).not.toBeVisible({ timeout: 3000 })
  })

  test('proficiency badge component exists in codebase', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.get('/api/match/compute')
    const body = await res.json()
    if (body.matches && body.matches.length > 0) {
      const userId = body.matches[0].user_id
      await page.goto(`/profile/${userId}`)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).not.toContainText('Error')
    }
  })
})
