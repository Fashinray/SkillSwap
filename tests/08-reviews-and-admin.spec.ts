import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Peer Reviews and Reputation', () => {
  test('sessions page loads for completed session check', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  })

  test('public profile shows no-shows count', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const responsePromise = page.waitForResponse('**/api/match/compute', { timeout: 15000 })
    await page.goto('/match')
    const response = await responsePromise
    const body = await response.json()
    if (body.matches.length > 0) {
      const userId = body.matches[0].user_id
      await page.goto(`/profile/${userId}`)
      await expect(page.locator('text=no-shows')).toBeVisible({ timeout: 5000 })
    }
  })

  test('booking form shows commitment deposit section', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    const bookSection = page.locator('text=Book a Session')
    if (await bookSection.isVisible({ timeout: 3000 })) {
      await expect(page.locator('text=Commitment Deposit')).toBeVisible()
    }
  })
})

test.describe('Admin Panel', () => {
  test('non-admin cannot access admin page', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('admin ghost sweep API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.post('/api/admin/ghost-sweep')
    expect(res.status()).toBe(403)
  })

  test('admin users API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/users', {
      data: { userId: 'test', action: 'suspend' },
    })
    expect(res.status()).toBe(403)
  })

  test('admin disputes API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/disputes', {
      data: { disputeId: 'test', sessionId: 'test', decision: 'dismissed' },
    })
    expect(res.status()).toBe(403)
  })

  test('admin escrow API is protected', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.patch('/api/admin/escrow', {
      data: { escrowId: 'test', sessionId: 'test', action: 'release' },
    })
    expect(res.status()).toBe(403)
  })
})
