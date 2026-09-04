import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /join skillswap/i })).toBeVisible()
    await expect(page.locator('input[name="fullName"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'notreal@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.text-red-700, .text-red-600').first()).toBeVisible({ timeout: 8000 })
  })

  test('seeded user can log in successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'amaka.okonkwo@skillswap.test')
    await page.fill('input[name="password"]', 'SkillSwap2024!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})
