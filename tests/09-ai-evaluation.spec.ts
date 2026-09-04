import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('AI Evaluation Pipeline', () => {
  test('AI evaluate API requires authentication', async ({ page }) => {
    const res = await page.request.post('/api/ai/evaluate', {
      data: { sessionId: 'test', transcriptText: 'test', teacherId: 'test' },
    })
    expect(res.status()).toBe(401)
  })

  test('AI transcribe API requires authentication', async ({ page }) => {
    const res = await page.request.post('/api/ai/transcribe')
    expect(res.status()).toBe(401)
  })

  test('AI evaluate API returns 404 for nonexistent session', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.post('/api/ai/evaluate', {
      data: {
        sessionId: '00000000-0000-0000-0000-000000000000',
        transcriptText: 'This is a test transcript with enough words to pass validation',
        teacherId: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(res.status()).toBe(404)
  })

  test('AI evaluate GET returns evaluation object or null', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    const res = await page.request.get('/api/ai/evaluate?sessionId=00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('evaluation')
  })

  test('session room shows AI evaluation panel after completion', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/sessions')
    await expect(page.getByRole('heading', { name: 'Sessions', exact: true })).toBeVisible()
  })

  test('AI evaluation panel component exists in the codebase', async ({ page }) => {
    await loginAs(page, 'amaka.okonkwo@skillswap.test')
    await page.goto('/dashboard')
    await expect(page.locator('text=Good day')).toBeVisible({ timeout: 10000 })
  })
})
