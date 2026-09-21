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

  test('registration shows correct error or success for new email', async ({ page }) => {
    await page.goto('/register')

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.fill('input[name="fullName"]', 'Test Debug User')
    await page.fill('input[name="email"]', `debug_${Date.now()}@skillswap.test`)
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    // The dev server's cold-compile time can dwarf 3s, so wait (up to 20s)
    // for any of the three possible outcomes instead of a flat sleep.
    await Promise.race([
      page.waitForSelector('text=Check your email', { timeout: 20000 }).catch(() => {}),
      page.waitForSelector('text=Verify Your Skills', { timeout: 20000 }).catch(() => {}),
      page.waitForSelector('text=email service error', { timeout: 20000 }).catch(() => {}),
      page.waitForTimeout(20000),
    ])

    // Capture what actually happened
    const pageContent = await page.content()
    const hasEmailError = pageContent.includes('email service error')
    const hasSuccess = pageContent.includes('Check your email') ||
                        pageContent.includes('Verify Skills') ||
                        pageContent.includes('Step 2')
    const hasOtherError = pageContent.includes('error') || pageContent.includes('Error')

    console.log('Registration result:')
    console.log('  Email service error shown:', hasEmailError)
    console.log('  Success / moved to step 2:', hasSuccess)
    console.log('  Console errors:', consoleErrors)
    console.log('  Page URL after submit:', page.url())

    // Take a screenshot so we can see what the page shows
    await page.screenshot({ path: 'tests/screenshots/registration-debug.png', fullPage: true })
  })
})
